/**
 * app.js
 * Main Single Page Application controller for CCDV-F Exam Simulator
 * Theme: Claude Studio (Warm Editorial Light Theme)
 */

import { Storage } from './storage.js';
import { Analytics, DOMAIN_METADATA } from './analytics.js';

// Global Application State
const State = {
  currentView: 'dashboard',
  allExams: [],
  sourcesMetadata: null,
  activeExam: null,
  currentQuestionIndex: 0,
  userAnswers: {},          // { [qId]: ['A', 'C'] }
  flaggedQuestions: new Set(),
  timerSecondsRemaining: 120 * 60,
  timerEndTime: null,       // Wall-clock timestamp for drift prevention
  timerInterval: null,
  lastCompletedAttempt: null,
  isReviewMode: false,      // when reviewing a finished exam
  drillMode: null           // null, 'vault', or 'topic'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.EXAM_DATA) {
    State.allExams = window.EXAM_DATA.exams || [];
    State.sourcesMetadata = window.EXAM_DATA.sources || null;
  }
  
  // Initialize Progressive Web App capabilities
  initPWA();

  // Set up Hash router
  window.addEventListener('hashchange', handleRouting);
  
  // Wall-clock sync on tab visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && State.timerEndTime && State.currentView === 'exam' && !State.isReviewMode) {
      const now = Date.now();
      State.timerSecondsRemaining = Math.max(0, Math.round((State.timerEndTime - now) / 1000));
      updateTimerDisplay();
      if (State.timerSecondsRemaining <= 0) {
        clearInterval(State.timerInterval);
        alert('Time expired while you were away! Submitting exam.');
        finishExam();
      }
    }
  });

  // Modal Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const mobileModal = document.getElementById('mobile-matrix-modal');
      if (mobileModal && !mobileModal.classList.contains('hidden')) {
        toggleMobileMatrix(false);
        return;
      }
      const submitModal = document.getElementById('submit-modal');
      if (submitModal && !submitModal.classList.contains('hidden')) {
        closeSubmitModal();
      }
    }
  });

  // Initial Route
  handleRouting();
});

// PWA Service Worker & Offline Liveness Support
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          console.log('[PWA] Service worker registered with scope:', reg.scope);
        })
        .catch(err => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    });

    navigator.serviceWorker.ready.then(() => {
      updateConnectionBadge();
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      updateConnectionBadge();
    });
  }

  function updateConnectionBadge() {
    const badge = document.getElementById('connection-badge');
    if (!badge) return;

    const isOffline = !navigator.onLine;
    const hasActiveController = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);

    if (isOffline) {
      badge.className = "px-2 py-0.5 rounded-full text-xs font-mono border border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span><span id="connection-text">Offline Mode</span>';
    } else if (hasActiveController) {
      badge.className = "px-2 py-0.5 rounded-full text-xs font-mono border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span><span id="connection-text">Offline Ready</span>';
    } else {
      badge.className = "px-2 py-0.5 rounded-full text-xs font-mono border border-stone-200 bg-stone-100 text-stone-600 flex items-center gap-1";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-stone-400" aria-hidden="true"></span><span id="connection-text">Online</span>';
    }
  }

  window.addEventListener('online', updateConnectionBadge);
  window.addEventListener('offline', updateConnectionBadge);
  updateConnectionBadge();

  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.onclick = async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log(`[PWA] Install prompt outcome: ${outcome}`);
        deferredInstallPrompt = null;
        installBtn.classList.add('hidden');
      };
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App successfully installed');
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.classList.add('hidden');
  });
}

// View Routing
function handleRouting() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  const parts = hash.split('/');
  const route = parts[0];
  const param = parts[1];

  // Pause timer if leaving exam view without finishing
  if (State.currentView === 'exam' && route !== 'exam' && State.timerInterval) {
    pauseTimer();
  }
  if (route !== 'exam') {
    toggleMobileMatrix(false);
  }

  State.currentView = route;
  updateNavUI(route);

  // Hide all view containers
  document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));

  switch (route) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'exam':
      renderExamRunner(param);
      break;
    case 'results':
      renderResults(param);
      break;
    case 'gaps':
      renderGapsView();
      break;
    case 'vault':
      renderVaultView();
      break;
    case 'sources':
      renderSourcesView();
      break;
    default:
      renderDashboard();
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function updateNavUI(activeRoute) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.dataset.route;
    if (route === activeRoute) {
      link.setAttribute('aria-current', 'page');
      link.className = "nav-link shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium bg-brand-terracotta-tint text-brand-terracotta border border-brand-terracotta-line";
    } else {
      link.removeAttribute('aria-current');
      link.className = "nav-link shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition";
    }
  });

  // Update quick stats in header
  const attempts = Storage.getAttempts();
  const fullExams = attempts.filter(a => (a.exam_id !== undefined ? a.exam_id < 900 : true) && a.total_questions >= 50);
  const statsEl = document.getElementById('header-stats-pill');
  if (statsEl) {
    if (fullExams.length === 0) {
      statsEl.textContent = "10 Mock Exams · 530 Questions Ready";
    } else {
      const avg = Math.round(fullExams.reduce((acc, a) => acc + a.percentage, 0) / fullExams.length);
      const passedCount = fullExams.filter(a => a.is_passing).length;
      statsEl.textContent = `Full Exams: ${fullExams.length} · Avg: ${avg}% (${passedCount} passed)`;
    }
  }
}

// Helper: Count truly answered questions (not empty arrays)
function getAnsweredCount() {
  return Object.values(State.userAnswers).filter(a => Array.isArray(a) && a.length > 0).length;
}

// -------------------------------------------------------------
// DASHBOARD VIEW
// -------------------------------------------------------------
function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  container.classList.remove('hidden');

  const attempts = Storage.getAttempts();
  const missedVault = Storage.getMissedQuestions();
  const diagnostic = Analytics.diagnoseGaps(attempts, missedVault);

  // Resume Banner if an active exam exists in storage
  const savedActive = Storage.getActiveExam();
  const resumeContainer = document.getElementById('resume-banner-container');
  if (savedActive && savedActive.exam_id) {
    const answeredCount = Object.values(savedActive.userAnswers || {}).filter(a => Array.isArray(a) && a.length > 0).length;
    const totalQ = savedActive.drillQuestions ? savedActive.drillQuestions.length : 53;
    resumeContainer.innerHTML = `
      <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-amber-500 shrink-0" aria-hidden="true"></span>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Active Exam in Progress: ${escapeHtml(savedActive.exam_title || 'Mock Exam')}</h3>
            <p class="text-xs text-stone-600 font-sans">${answeredCount} of ${totalQ} answered · ${Math.floor(savedActive.timerSecondsRemaining / 60)} minutes remaining</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.App.discardActiveExam()" class="px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition">
            Discard
          </button>
          <a href="#exam" class="px-4 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition flex items-center gap-1.5">
            <span>Resume Exam</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    `;
    resumeContainer.classList.remove('hidden');
  } else {
    resumeContainer.classList.add('hidden');
  }

  // Quick Diagnostic Strip (only displayed once user has taken at least 1 exam)
  const diagContainer = document.getElementById('dashboard-readiness-card');
  if (diagContainer) {
    if (diagnostic.total_attempts > 0) {
      diagContainer.innerHTML = `
        <div class="px-4 py-3.5 rounded-xl bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-3 text-stone-700">
            <span class="font-semibold text-stone-900">${diagnostic.full_attempts || 0}/10 Completed</span>
            <span class="text-stone-300" aria-hidden="true">·</span>
            <span>Avg: <strong class="text-stone-900">${diagnostic.average_score}%</strong></span>
            <span class="text-stone-300" aria-hidden="true">·</span>
            <span class="${diagnostic.average_score >= 72 ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}">${diagnostic.readiness_level}</span>
            ${missedVault.length > 0 ? `<span class="text-stone-300" aria-hidden="true">·</span><span class="text-amber-800 font-medium">${missedVault.length} in Vault</span>` : ''}
          </div>
          <a href="#gaps" class="text-brand-terracotta hover:text-brand-terracotta-deep font-medium transition">
            Diagnostics &rarr;
          </a>
        </div>
      `;
      diagContainer.classList.remove('hidden');
    } else {
      diagContainer.innerHTML = '';
      diagContainer.classList.add('hidden');
    }
  }

  // Form Register: one ledger row per mock exam
  const registerContainer = document.getElementById('exam-register');
  if (!registerContainer) return;
  registerContainer.innerHTML = '';

  State.allExams.forEach(exam => {
    const bestAttempt = Storage.getExamBestScore(exam.exam_id);
    const formNum = String(exam.exam_id).padStart(2, '0');

    let statusBadge = `<span class="text-xs font-mono text-stone-500">Untested</span>`;
    if (bestAttempt) {
      if (bestAttempt.is_passing) {
        statusBadge = `<span class="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">${bestAttempt.percentage}% passed</span>`;
      } else {
        statusBadge = `<span class="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">${bestAttempt.percentage}% best</span>`;
      }
    }

    const row = document.createElement('li');
    row.className = "px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap sm:items-center gap-x-4 gap-y-3 hover:bg-stone-50/80 transition";

    row.innerHTML = `
      <span class="hidden sm:block font-editorial text-2xl leading-none text-stone-400 w-9 text-right shrink-0" aria-hidden="true">${formNum}</span>
      <div class="flex-1 min-w-[10rem]">
        <h3 class="text-base font-editorial text-stone-900 leading-snug">Mock Exam #${exam.exam_id}</h3>
        <p class="text-xs font-mono text-stone-500 mt-0.5">Form ${formNum} · 53 questions · 120 minutes</p>
      </div>
      <div class="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
        ${bestAttempt ? `
          <button type="button" onclick="window.App.viewPreviousResult('${bestAttempt.id}')" class="text-xs font-mono text-stone-500 hover:text-stone-900 underline-offset-2 hover:underline transition">
            Score
          </button>
        ` : '<span aria-hidden="true"></span>'}
        <button type="button" onclick="window.App.startExam(${exam.exam_id})" class="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition shrink-0">
          ${bestAttempt ? 'Retake' : 'Start'} <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    `;
    registerContainer.appendChild(row);
  });
}

// -------------------------------------------------------------
// EXAM RUNNER VIEW
// -------------------------------------------------------------
function renderExamRunner(paramId) {
  const container = document.getElementById('view-exam');
  container.classList.remove('hidden');

  // P1-1: Exit review mode if navigating to a different exam ID
  if (State.isReviewMode) {
    if (paramId && parseInt(paramId) !== State.activeExam?.exam_id) {
      State.isReviewMode = false;
      State.reviewAttempt = null;
    }
  }

  // Check if an in-progress exam is saved in storage
  const savedActive = Storage.getActiveExam();

  if (!State.isReviewMode) {
    if (savedActive && (!paramId || parseInt(paramId) === savedActive.exam_id)) {
      // Restore from active storage
      let fullExam = null;
      if (savedActive.exam_id < 900) {
        fullExam = State.allExams.find(e => e.exam_id === savedActive.exam_id);
      } else if (savedActive.drillQuestions) {
        fullExam = {
          exam_id: savedActive.exam_id,
          title: savedActive.exam_title,
          description: "Targeted Drill Session",
          time_limit_minutes: Math.ceil((savedActive.timerSecondsRemaining ?? 7200) / 60),
          questions: savedActive.drillQuestions
        };
      }
      
      if (fullExam) {
        State.activeExam = fullExam;
        State.currentQuestionIndex = savedActive.currentQuestionIndex || 0;
        State.userAnswers = savedActive.userAnswers || {};
        State.flaggedQuestions = new Set(savedActive.flaggedQuestions || []);
        State.timerSecondsRemaining = savedActive.timerSecondsRemaining ?? (fullExam.time_limit_minutes * 60);
      } else {
        startFreshExam(paramId);
      }
    } else if (savedActive && paramId && parseInt(paramId) !== savedActive.exam_id) {
      // P1-2: Confirm before overwriting saved in-progress exam
      const hasAnswers = savedActive.userAnswers && Object.values(savedActive.userAnswers).some(a => Array.isArray(a) && a.length > 0);
      if (hasAnswers) {
        const confirmMsg = `You have an in-progress session for "${savedActive.exam_title || ('Exam #' + savedActive.exam_id)}". Starting this exam will discard your saved progress. Proceed?`;
        if (confirm(confirmMsg)) {
          Storage.clearActiveExam();
          startFreshExam(paramId);
        } else {
          window.location.hash = savedActive.exam_id < 900 ? `#exam/${savedActive.exam_id}` : '#exam';
          return;
        }
      } else {
        Storage.clearActiveExam();
        startFreshExam(paramId);
      }
    } else {
      startFreshExam(paramId);
    }
  }

  // Setup UI for current question
  renderCurrentQuestion();
  renderQuestionMatrix();
  startTimer();
}

function startFreshExam(paramId) {
  const idToLoad = paramId ? parseInt(paramId) : 1;
  const foundExam = State.allExams.find(e => e.exam_id === idToLoad);
  if (!foundExam) {
    window.location.hash = '#dashboard';
    return;
  }
  initNewExamSession(foundExam);
}

function initNewExamSession(exam) {
  State.activeExam = exam;
  State.currentQuestionIndex = 0;
  State.userAnswers = {};
  State.flaggedQuestions = new Set();
  State.timerSecondsRemaining = (exam.time_limit_minutes || 120) * 60;
  State.timerEndTime = Date.now() + State.timerSecondsRemaining * 1000;
  State.isReviewMode = false;
  State.drillMode = null;

  saveCurrentSession();
}

function saveCurrentSession() {
  if (State.activeExam && !State.isReviewMode) {
    Storage.saveActiveExam({
      exam: State.activeExam,
      currentQuestionIndex: State.currentQuestionIndex,
      userAnswers: State.userAnswers,
      flaggedQuestions: Array.from(State.flaggedQuestions),
      timerSecondsRemaining: State.timerSecondsRemaining
    });
  }
}

function renderCurrentQuestion() {
  const exam = State.activeExam;
  if (!exam || !exam.questions || exam.questions.length === 0) return;

  const q = exam.questions[State.currentQuestionIndex];
  const qNum = State.currentQuestionIndex + 1;
  const totalQ = exam.questions.length;

  // Header info
  document.getElementById('exam-title-header').textContent = exam.title + (State.isReviewMode ? ' (Review Mode)' : '');
  document.getElementById('q-counter').textContent = `Question ${qNum} of ${totalQ}`;
  
  const domainInfo = DOMAIN_METADATA[q.domain_id] || { name: q.domain_name, weight: 10 };
  const domainBadge = document.getElementById('domain-badge');
  domainBadge.textContent = `${q.domain_id}: ${domainInfo.name} (${domainInfo.weight}%)`;

  const topicBadge = document.getElementById('topic-badge');
  topicBadge.textContent = q.topic || 'Core Scenario';

  // Flag state & visibility in review mode
  const flagBtn = document.getElementById('flag-btn');
  if (State.isReviewMode) {
    flagBtn.classList.add('hidden');
  } else {
    flagBtn.classList.remove('hidden');
    const isFlagged = State.flaggedQuestions.has(q.id);
    flagBtn.setAttribute('aria-pressed', String(isFlagged));
    flagBtn.setAttribute('aria-label', isFlagged ? 'Flagged for review' : 'Flag for review');
    if (isFlagged) {
      flagBtn.className = "px-3 py-2 rounded-lg text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5";
      flagBtn.innerHTML = `<span aria-hidden="true">★</span><span class="hidden sm:inline">Flagged</span>`;
    } else {
      flagBtn.className = "px-3 py-2 rounded-lg text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center gap-1.5 transition";
      flagBtn.innerHTML = `<span aria-hidden="true">☆</span><span class="hidden sm:inline">Flag for Review</span>`;
    }
  }

  // Question Prompt
  const promptEl = document.getElementById('question-prompt');
  promptEl.innerHTML = formatPromptText(q.prompt);

  // Question Type Guidance
  const typeGuidance = document.getElementById('question-type-guidance');
  const isMultiple = Analytics.isMulti(q);
  if (isMultiple) {
    typeGuidance.textContent = `Multiple Response — Select ${q.correct_answers.length} options:`;
    typeGuidance.classList.add('text-amber-800', 'font-semibold');
  } else {
    typeGuidance.textContent = `Single Choice — Select ONE option:`;
    typeGuidance.classList.remove('text-amber-800', 'font-semibold');
  }

  // Options
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  const userSelected = State.userAnswers[q.id] || [];

  q.options.forEach(opt => {
    const isUserChoice = userSelected.includes(opt.key);
    const isCorrectChoice = q.correct_answers.includes(opt.key);
    const card = document.createElement('div');
    const inputId = `opt-${q.id}-${opt.key}`;

    let cardClasses = "p-4 rounded-xl border transition flex items-start gap-4 ";
    let radioDisabled = "";

    if (State.isReviewMode) {
      radioDisabled = "disabled";
      if (isCorrectChoice) {
        // High visual contrast for correct choice
        cardClasses += "border-2 border-emerald-600 bg-emerald-50/80";
      } else if (isUserChoice && !isCorrectChoice) {
        // High visual contrast for wrong user choice
        cardClasses += "border-2 border-rose-500 bg-rose-50/80";
      } else {
        cardClasses += "border-stone-200 bg-white opacity-70";
      }
    } else {
      card.onclick = () => handleOptionClick(q, opt.key, isMultiple);
      if (isUserChoice) {
        cardClasses += "border-2 border-brand-terracotta bg-brand-terracotta-tint/60 cursor-pointer";
      } else {
        cardClasses += "border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 cursor-pointer";
      }
    }

    card.className = cardClasses;

    let markerBadge = '';
    if (State.isReviewMode) {
      if (isCorrectChoice) {
        markerBadge = `<span class="ml-auto text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded whitespace-nowrap">✓ Correct</span>`;
      } else if (isUserChoice) {
        markerBadge = `<span class="ml-auto text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded whitespace-nowrap">✕ Your Choice</span>`;
      }
    }

    card.innerHTML = `
      <div class="mt-0.5 shrink-0">
        <input type="${isMultiple ? 'checkbox' : 'radio'}" id="${inputId}" name="question_opt" ${isUserChoice ? 'checked' : ''} ${radioDisabled} class="cursor-pointer">
      </div>
      <div class="flex-1">
        <label for="${inputId}" class="cursor-pointer">
          <span class="font-editorial font-bold text-base ${isUserChoice ? 'text-brand-terracotta' : 'text-stone-700'} mr-2">${opt.key}.</span>
          <span class="text-base ${isUserChoice ? 'text-stone-900 font-medium' : 'text-stone-800'} leading-relaxed font-sans">${escapeHtml(opt.text)}</span>
        </label>
      </div>
      ${markerBadge}
    `;
    optionsContainer.appendChild(card);
  });

  // Review mode / Explanation drawer
  const explanationBox = document.getElementById('explanation-drawer');
  if (State.isReviewMode) {
    explanationBox.classList.remove('hidden');
    explanationBox.innerHTML = `
      <div class="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Answer Key &amp; Official Rationale</span>
          <span class="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Official Correct: ${q.correct_answers.join(', ')}</span>
        </div>
        <p class="text-sm text-stone-800 leading-relaxed font-sans">${escapeHtml(q.explanation)}</p>
        ${q.distractor_explanations && Object.keys(q.distractor_explanations).length > 0 ? `
          <div class="pt-2 border-t border-stone-200 text-xs text-stone-600 space-y-1">
            <span class="font-semibold text-stone-800">Distractor Analysis:</span>
            ${Object.entries(q.distractor_explanations).map(([k, exp]) => `
              <div><strong>Option ${k}:</strong> ${escapeHtml(exp)}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  } else {
    explanationBox.classList.add('hidden');
  }

  // Update Prev / Next buttons
  const prevBtn = document.getElementById('prev-q-btn');
  const nextBtn = document.getElementById('next-q-btn');

  prevBtn.disabled = State.currentQuestionIndex === 0;
  prevBtn.className = State.currentQuestionIndex === 0
    ? "px-4 py-2 rounded-lg text-xs font-medium text-stone-500 bg-stone-100 cursor-not-allowed"
    : "px-4 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition";

  if (State.currentQuestionIndex === totalQ - 1) {
    if (State.isReviewMode) {
      nextBtn.innerHTML = `<span>Back to Results</span> <span aria-hidden="true">&rarr;</span>`;
      nextBtn.className = "px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5";
    } else {
      nextBtn.innerHTML = `<span>Finish &amp; Review</span> <span aria-hidden="true">&rarr;</span>`;
      nextBtn.className = "px-5 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition flex items-center gap-1.5";
    }
  } else {
    nextBtn.innerHTML = `<span>Next Question</span> <span aria-hidden="true">&rarr;</span>`;
    nextBtn.className = "px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5";
  }

  // Hide submit button in sidebar during review
  const sidebarSubmit = document.querySelector('#view-exam button[onclick="window.App.openSubmitModal()"]');
  if (sidebarSubmit) {
    if (State.isReviewMode) {
      sidebarSubmit.classList.add('hidden');
    } else {
      sidebarSubmit.classList.remove('hidden');
    }
  }
}

function handleOptionClick(q, optKey, isMultiple) {
  if (State.isReviewMode) return;

  let current = State.userAnswers[q.id] || [];
  if (isMultiple) {
    if (current.includes(optKey)) {
      current = current.filter(k => k !== optKey);
    } else {
      current.push(optKey);
    }
  } else {
    current = [optKey];
  }

  // If array is empty, delete key so it is not counted as answered
  if (current.length === 0) {
    delete State.userAnswers[q.id];
  } else {
    State.userAnswers[q.id] = current;
  }

  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

function toggleFlag() {
  if (State.isReviewMode) return;
  const exam = State.activeExam;
  if (!exam) return;
  const q = exam.questions[State.currentQuestionIndex];
  if (State.flaggedQuestions.has(q.id)) {
    State.flaggedQuestions.delete(q.id);
  } else {
    State.flaggedQuestions.add(q.id);
  }
  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

function nextQuestion() {
  const exam = State.activeExam;
  if (!exam) return;
  if (State.currentQuestionIndex < exam.questions.length - 1) {
    State.currentQuestionIndex++;
    saveCurrentSession();
    renderCurrentQuestion();
    renderQuestionMatrix();
  } else {
    if (State.isReviewMode) {
      window.location.hash = State.lastCompletedAttempt ? `#results/${State.lastCompletedAttempt.id}` : '#dashboard';
    } else {
      openSubmitModal();
    }
  }
}

function prevQuestion() {
  if (State.currentQuestionIndex > 0) {
    State.currentQuestionIndex--;
    saveCurrentSession();
    renderCurrentQuestion();
    renderQuestionMatrix();
  }
}

function goToQuestion(index) {
  State.currentQuestionIndex = index;
  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

function clearCurrentAnswer() {
  const exam = State.activeExam;
  if (!exam || State.isReviewMode) return;
  const q = exam.questions[State.currentQuestionIndex];
  delete State.userAnswers[q.id];
  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

// Question Grid / Matrix
function renderQuestionMatrix() {
  const exam = State.activeExam;
  if (!exam) return;

  const matrixContainer = document.getElementById('question-matrix-grid');
  const mobileContainer = document.getElementById('mobile-question-matrix-grid');
  if (!matrixContainer && !mobileContainer) return;

  const answeredCount = getAnsweredCount();
  const flaggedCount = State.flaggedQuestions.size;
  const totalCount = exam.questions.length;

  const summaryText = `${answeredCount} of ${totalCount} answered · ${flaggedCount} flagged`;
  const summaryEl = document.getElementById('matrix-summary-text');
  if (summaryEl) summaryEl.textContent = summaryText;
  const mobileSummaryEl = document.getElementById('mobile-matrix-summary-text');
  if (mobileSummaryEl) mobileSummaryEl.textContent = summaryText;

  const mobBtnLabel = document.getElementById('mobile-matrix-btn-label');
  if (mobBtnLabel) mobBtnLabel.textContent = `Grid (${totalCount})`;

  if (matrixContainer) matrixContainer.innerHTML = '';
  if (mobileContainer) mobileContainer.innerHTML = '';

  exam.questions.forEach((q, idx) => {
    const isAnswered = State.userAnswers[q.id] && State.userAnswers[q.id].length > 0;
    const isFlagged = State.flaggedQuestions.has(q.id);
    const isCurrent = idx === State.currentQuestionIndex;

    let baseClasses = "rounded-lg text-xs font-mono flex items-center justify-center transition relative ";

    if (State.isReviewMode) {
      const userSel = State.userAnswers[q.id] || [];
      const correctSel = q.correct_answers || [];
      const isCorrect = userSel.length === correctSel.length && userSel.every(k => correctSel.includes(k));
      if (isCurrent) {
        baseClasses += "ring-2 ring-stone-900 font-bold ";
      }
      if (isCorrect) {
        baseClasses += "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 ";
      } else {
        baseClasses += "bg-rose-100 text-rose-800 font-bold border border-rose-300 ";
      }
    } else {
      if (isCurrent) {
        baseClasses += "ring-2 ring-brand-terracotta font-bold bg-brand-terracotta-tint text-brand-terracotta ";
      } else if (isAnswered) {
        baseClasses += "bg-stone-800 text-white font-medium ";
      } else {
        baseClasses += "bg-stone-100 text-stone-600 hover:bg-stone-200 ";
      }

      if (isFlagged) {
        baseClasses += "border-2 border-amber-500 ";
      }
    }

    const flagBadge = isFlagged && !State.isReviewMode ? '<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>' : '';

    if (matrixContainer) {
      const btn = document.createElement('button');
      btn.onclick = () => goToQuestion(idx);
      btn.className = "w-9 h-9 " + baseClasses;
      btn.innerHTML = `${idx + 1}${flagBadge}`;
      matrixContainer.appendChild(btn);
    }

    if (mobileContainer) {
      const mobBtn = document.createElement('button');
      mobBtn.onclick = () => {
        goToQuestion(idx);
        toggleMobileMatrix(false);
      };
      mobBtn.className = "w-11 h-11 min-h-[44px] text-sm " + baseClasses;
      mobBtn.innerHTML = `${idx + 1}${flagBadge}`;
      mobileContainer.appendChild(mobBtn);
    }
  });
}

function toggleMobileMatrix(forceState) {
  const modal = document.getElementById('mobile-matrix-modal');
  if (!modal) return;
  const isHidden = modal.classList.contains('hidden');
  const shouldOpen = forceState !== undefined ? forceState : isHidden;
  if (shouldOpen) {
    showModal(modal, modal.querySelector('[data-matrix-close]'));
    document.body.style.overflow = 'hidden';
    renderQuestionMatrix();
  } else {
    hideModal(modal);
    document.body.style.overflow = '';
  }
}

// Modal focus management: move focus in on open, restore it on close
let lastFocusedEl = null;
function showModal(modal, focusTarget) {
  lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.classList.remove('hidden');
  if (focusTarget) focusTarget.focus();
}
function hideModal(modal) {
  modal.classList.add('hidden');
  if (lastFocusedEl && document.contains(lastFocusedEl)) lastFocusedEl.focus();
  lastFocusedEl = null;
}

// Timer Logic
function startTimer() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  if (State.isReviewMode) {
    document.getElementById('timer-display').textContent = 'Review Mode';
    return;
  }

  // Anchor wall-clock end time
  State.timerEndTime = Date.now() + State.timerSecondsRemaining * 1000;
  updateTimerDisplay();

  State.timerInterval = setInterval(() => {
    const now = Date.now();
    State.timerSecondsRemaining = Math.max(0, Math.round((State.timerEndTime - now) / 1000));
    updateTimerDisplay();

    if (State.timerSecondsRemaining % 30 === 0) {
      saveCurrentSession();
    }

    if (State.timerSecondsRemaining <= 0) {
      clearInterval(State.timerInterval);
      alert('Time is up! Submitting exam automatically.');
      finishExam();
    }
  }, 1000);
}

function pauseTimer() {
  if (State.timerInterval) {
    clearInterval(State.timerInterval);
    State.timerInterval = null;
  }
  if (!State.isReviewMode && State.activeExam) {
    saveCurrentSession();
  }
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const hours = Math.floor(State.timerSecondsRemaining / 3600);
  const minutes = Math.floor((State.timerSecondsRemaining % 3600) / 60);
  const seconds = State.timerSecondsRemaining % 60;

  const formatted = `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  el.textContent = formatted;

  if (State.timerSecondsRemaining <= 10 * 60) {
    el.className = "font-mono font-bold text-red-600 animate-pulse";
  } else if (State.timerSecondsRemaining <= 30 * 60) {
    el.className = "font-mono font-bold text-amber-700";
  } else {
    el.className = "font-mono text-stone-800";
  }
}

// Exam Submission Modal
function openSubmitModal() {
  if (State.isReviewMode) return;
  const exam = State.activeExam;
  if (!exam) return;

  const total = exam.questions.length;
  const answered = getAnsweredCount();
  const unanswered = total - answered;
  const flagged = State.flaggedQuestions.size;

  const modal = document.getElementById('submit-modal');
  showModal(modal, modal.querySelector('[data-autofocus]'));

  document.getElementById('modal-answered-count').textContent = answered;
  document.getElementById('modal-unanswered-count').textContent = unanswered;
  document.getElementById('modal-flagged-count').textContent = flagged;

  const warnEl = document.getElementById('modal-unanswered-warning');
  if (unanswered > 0) {
    warnEl.classList.remove('hidden');
    warnEl.textContent = `Warning: You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Unanswered questions score zero.`;
  } else {
    warnEl.classList.add('hidden');
  }
}

function closeSubmitModal() {
  hideModal(document.getElementById('submit-modal'));
}

function finishExam() {
  closeSubmitModal();
  toggleMobileMatrix(false);
  pauseTimer();

  const exam = State.activeExam;
  if (!exam || !exam.questions || exam.questions.length === 0) {
    window.location.hash = '#dashboard';
    return;
  }

  const evalResult = Analytics.evaluateExam(exam, State.userAnswers);

  const attempt = {
    exam_id: exam.exam_id,
    exam_title: exam.title,
    time_spent_seconds: (exam.time_limit_minutes * 60) - (State.timerSecondsRemaining ?? 0),
    questions: exam.exam_id >= 900 ? exam.questions : null, // keep questions for drill reviews
    ...evalResult,
    user_answers: JSON.parse(JSON.stringify(State.userAnswers))
  };

  // If this was a remediation drill, remove correctly answered questions from vault
  if (State.drillMode === 'vault' || exam.exam_id >= 900) {
    const correctIds = exam.questions
      .filter(q => {
        const userSel = State.userAnswers[q.id] || [];
        const correctSel = q.correct_answers || [];
        return userSel.length === correctSel.length && userSel.every(k => correctSel.includes(k));
      })
      .map(q => q.id);
    if (correctIds.length > 0) {
      Storage.clearMasteredQuestions(correctIds);
    }
  }

  // Save to persistent storage
  Storage.saveAttempt(attempt);
  Storage.clearActiveExam();

  State.lastCompletedAttempt = attempt;
  window.location.hash = `#results/${attempt.id}`;
}

// -------------------------------------------------------------
// RESULTS & SCORECARD VIEW
// -------------------------------------------------------------
function renderResults(attemptId) {
  const container = document.getElementById('view-results');
  container.classList.remove('hidden');

  let attempt = State.lastCompletedAttempt;
  if (attemptId) {
    const found = Storage.getAttempts().find(a => a.id === attemptId);
    if (found) attempt = found;
  }

  if (!attempt) {
    window.location.hash = '#dashboard';
    return;
  }

  // Grand Score Card
  const scoreCard = document.getElementById('results-score-card');
  const isPass = attempt.is_passing;

  scoreCard.className = `p-5 sm:p-8 rounded-2xl border ${isPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/50 border-amber-300'} shadow-sm space-y-6`;
  scoreCard.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="text-xs font-editorial uppercase tracking-widest ${isPass ? 'text-emerald-800' : 'text-amber-800'} font-semibold">Official Score Report</span>
        <h2 class="text-3xl font-editorial text-stone-900">${escapeHtml(attempt.exam_title)}</h2>
        <p class="text-xs text-stone-600 mt-1">Completed on ${new Date(attempt.date).toLocaleString()} · Duration: ${Math.floor((attempt.time_spent_seconds || 0) / 60)} minutes</p>
      </div>
      <div class="px-5 py-2.5 rounded-xl font-mono text-center ${isPass ? 'bg-emerald-700 text-white shadow-md' : 'bg-amber-700 text-white shadow-md'}">
        <div class="text-xs uppercase tracking-wider font-sans font-bold">${isPass ? 'PASSED' : 'NEEDS IMPROVEMENT'}</div>
        <div class="text-2xl font-bold">${attempt.scaled_score} / 1000</div>
        <div class="text-xs opacity-90">${attempt.percentage}% · Pass bar: 720</div>
      </div>
    </div>

    <!-- Domain Breakdown Bars -->
    <div class="space-y-3 pt-4 border-t border-stone-200">
      <h3 class="text-sm font-semibold text-stone-900 font-sans">Domain-by-Domain Proficiency:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${Object.values(attempt.domain_stats).map(d => `
          <div class="p-3.5 rounded-xl bg-white border border-stone-200/90 space-y-2">
            <div class="flex items-center justify-between text-xs gap-2">
              <span class="font-medium text-stone-900">[${d.id}] ${escapeHtml(d.name)} (${d.weight}%)</span>
              <span class="font-mono ${d.total === 0 ? 'text-stone-500' : (d.percentage >= 72 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold')}">
                ${d.total === 0 ? 'Untested' : `${d.correct}/${d.total} (${d.percentage}%)`}
              </span>
            </div>
            <div class="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full ${d.total === 0 ? 'bg-stone-300' : (d.percentage >= 72 ? 'bg-emerald-600' : 'bg-amber-600')}" style="width: ${d.total === 0 ? 0 : d.percentage}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="pt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-3">
        <button data-action="review-attempt" data-attempt-id="${escapeHtml(attempt.id)}" class="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition">
          Review Question Explanations <span aria-hidden="true">&rarr;</span>
        </button>
        <a href="#vault" class="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition">
          View Missed Questions Vault (${attempt.missed_questions.length})
        </a>
      </div>
      <a href="#dashboard" class="text-xs text-stone-600 hover:text-stone-900 font-medium">
        <span aria-hidden="true">&larr;</span> Back to All Exams
      </a>
    </div>
  `;
}

// -------------------------------------------------------------
// GAPS & LAGGING AREAS VIEW (Task 3)
// -------------------------------------------------------------
function renderGapsView() {
  const container = document.getElementById('view-gaps');
  container.classList.remove('hidden');

  const attempts = Storage.getAttempts();
  const missedVault = Storage.getMissedQuestions();
  const diagnostic = Analytics.diagnoseGaps(attempts, missedVault);

  const content = document.getElementById('gaps-content');
  content.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Diagnostic Engine</span>
          <h2 class="text-2xl font-editorial text-stone-900">Lagging Areas &amp; Misconception Analysis</h2>
          <p class="text-xs text-stone-600 mt-1">Identifies specific technical blindspots across your practice exams so you can study with surgical precision.</p>
        </div>
        <button onclick="window.App.exportMistakesLog()" class="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span>Copy mistakes.md</span>
        </button>
      </div>

      <!-- Domain Rankings Table -->
      <div class="pt-4 border-t border-stone-200">
        <h3 class="text-sm font-semibold text-stone-900 mb-3">Domain Performance vs. 72% Passing Threshold:</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm font-sans">
            <thead>
              <tr class="border-b border-stone-200 text-stone-600 font-medium text-xs uppercase tracking-wide">
                <th class="py-2 pr-4">Domain</th>
                <th class="py-2 pr-4">Weight</th>
                <th class="py-2 pr-4">Questions Seen</th>
                <th class="py-2 pr-4">Accuracy</th>
                <th class="py-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              ${diagnostic.domain_rankings.map(d => `
                <tr class="${d.is_lagging && d.total > 0 ? 'bg-amber-50/50' : ''}">
                  <td class="py-2.5 pr-4 font-medium text-stone-900">[${d.id}] ${escapeHtml(d.name)}</td>
                  <td class="py-2.5 pr-4 text-stone-600 font-mono">${d.weight}%</td>
                  <td class="py-2.5 pr-4 text-stone-600 font-mono">${d.total}</td>
                  <td class="py-2.5 pr-4 font-mono ${d.percentage >= 72 ? 'text-emerald-700 font-bold' : (d.total === 0 ? 'text-stone-500' : 'text-amber-800 font-bold')}">${d.total > 0 ? d.percentage + '%' : '–'}</td>
                  <td class="py-2.5">
                    ${d.total === 0 ? '<span class="text-stone-500">Untested</span>' : (d.percentage >= 72 ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">Pass</span>' : '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-medium">Lagging Focus</span>')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Targeted Remediation Topics -->
    <div class="space-y-4">
      <h3 class="text-lg font-editorial text-stone-900">High-Impact Misconception Topics:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${diagnostic.top_topic_gaps.map(item => `
          <div class="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-base font-semibold text-stone-900">${escapeHtml(item.topic)}</h4>
              <span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap">${item.count} misses</span>
            </div>
            ${item.guide ? `
              <p class="text-sm text-stone-700 leading-relaxed font-sans">${escapeHtml(item.guide.summary)}</p>
              <div class="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                <strong>Watch out for:</strong> ${escapeHtml(item.guide.traps)}
              </div>
            ` : '<p class="text-sm text-stone-500 font-sans">Review missed questions in this category using the Vault.</p>'}
            <div class="pt-2 flex justify-end">
              <button data-action="topic-drill" data-topic="${escapeHtml(item.topic)}" class="text-xs font-semibold text-brand-terracotta hover:text-brand-terracotta-deep">
                Drill Missed Questions in this Topic <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// MISSED QUESTIONS VAULT VIEW (Task 3)
// -------------------------------------------------------------
function renderVaultView() {
  const container = document.getElementById('view-vault');
  container.classList.remove('hidden');

  const missedVault = Storage.getMissedQuestions();
  const content = document.getElementById('vault-content');

  content.innerHTML = `
    <!-- Top Header -->
    <div class="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Spaced Repetition &amp; Revision</span>
          <h2 class="text-2xl font-editorial text-stone-900">Missed Questions Vault</h2>
          <p class="text-xs text-stone-600 mt-1">Every question you missed across all exam attempts is preserved here for focused revision.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${missedVault.length > 0 ? `
            <button onclick="window.App.startRemediationQuiz()" class="px-4 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition">
              Start Remediation Quiz (${missedVault.length}) <span aria-hidden="true">&rarr;</span>
            </button>
          ` : ''}
          <button onclick="window.App.exportMistakesLog()" class="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition">
            Export to mistakes.md
          </button>
        </div>
      </div>
    </div>

    <!-- Questions List -->
    <div class="space-y-4">
      ${missedVault.length === 0 ? `
        <div class="p-6 sm:p-10 rounded-2xl bg-white border border-stone-200 space-y-3">
          <h3 class="text-xl font-editorial text-stone-900">Nothing in the vault yet.</h3>
          <p class="text-sm text-stone-600 leading-relaxed max-w-xl">Take a mock exam from the dashboard. Any question you answer incorrectly is filed here automatically, so your revision time goes to exactly the items you got wrong.</p>
          <div class="pt-1">
            <a href="#dashboard" class="inline-block px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition">Browse Mock Exams <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
      ` : missedVault.map(q => `
        <div class="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md font-mono font-semibold bg-brand-terracotta-tint text-brand-terracotta border border-brand-terracotta-line">[${q.domain_id}] ${escapeHtml(q.domain_name)}</span>
              <span class="text-stone-500 font-mono">${escapeHtml(q.topic || 'General')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-stone-500 font-mono">Missed ${q.miss_count || 1} time${(q.miss_count || 1) > 1 ? 's' : ''}</span>
              <button data-action="remove-vault" data-question-id="${escapeHtml(q.id)}" class="text-stone-500 hover:text-stone-800 text-xs font-mono" aria-label="Remove question from vault" title="Remove from vault">✕</button>
            </div>
          </div>

          <p class="text-base font-editorial text-stone-900 leading-relaxed font-normal">${escapeHtml(q.prompt)}</p>

          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-sm space-y-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-emerald-800">Correct Answer:</span>
              <span class="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold">${q.correct_answers.join(', ')}</span>
            </div>
            <p class="text-stone-700 leading-relaxed">${escapeHtml(q.explanation)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// -------------------------------------------------------------
// SOURCES & PROVENANCE VIEW (Task 1)
// -------------------------------------------------------------
function renderSourcesView() {
  const container = document.getElementById('view-sources');
  container.classList.remove('hidden');

  const meta = State.sourcesMetadata || { sources: [] };
  const content = document.getElementById('sources-content');

  content.innerHTML = `
    <div class="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Attribution &amp; Open Source Provenance</span>
      <h2 class="text-2xl font-editorial text-stone-900">Question Bank Provenance &amp; Attribution</h2>
      <p class="text-sm text-stone-600 leading-relaxed max-w-3xl">
        This platform synthesizes 530 authentic scenario questions balanced into 10 full 53-question exams. All questions are sourced from open developer study repositories, mapped to the official CCDV-F domain blueprint weights, and verified for accuracy.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
        ${meta.sources.map(src => {
          const safeUrl = (src.url && (src.url.startsWith('https://') || src.url.startsWith('http://'))) ? src.url : '#';
          return `
          <div class="p-5 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-sm font-semibold text-stone-900 font-mono">${escapeHtml(src.name)}</h4>
              <span class="px-2 py-0.5 rounded-full text-xs font-mono bg-stone-200 text-stone-700 font-medium whitespace-nowrap">${src.contributed_questions} questions</span>
            </div>
            <p class="text-sm text-stone-600 font-sans leading-relaxed">${escapeHtml(src.description)}</p>
            <div class="pt-2">
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-brand-terracotta hover:text-brand-terracotta-deep underline underline-offset-2 flex items-center gap-1">
                <span>View on GitHub</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// UTILITY FUNCTIONS & EXPORT HANDLERS
// -------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPromptText(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-900 text-xs font-mono font-medium">$1</code>');
  return formatted;
}

// Global API object attached to window.App
window.App = {
  startExam(examId) {
    const exam = State.allExams.find(e => e.exam_id === examId);
    if (!exam) return;
    initNewExamSession(exam);
    window.location.hash = `#exam/${examId}`;
  },

  discardActiveExam() {
    Storage.clearActiveExam();
    State.activeExam = null;
    renderDashboard();
  },

  nextQuestion,
  prevQuestion,
  toggleFlag,
  toggleMobileMatrix,
  clearCurrentAnswer,
  openSubmitModal,
  closeSubmitModal,
  finishExam,

  viewPreviousResult(attemptId) {
    window.location.hash = `#results/${attemptId}`;
  },

  reviewAttemptAnswers(attemptId) {
    const attempt = Storage.getAttempts().find(a => a.id === attemptId);
    if (!attempt) return;

    let exam = null;
    if (attempt.exam_id < 900) {
      exam = State.allExams.find(e => e.exam_id === attempt.exam_id);
    } else if (attempt.questions) {
      exam = {
        exam_id: attempt.exam_id,
        title: attempt.exam_title,
        description: "Targeted Drill Review",
        questions: attempt.questions
      };
    }

    if (!exam) return;
    State.activeExam = exam;
    State.userAnswers = attempt.user_answers || {};
    State.currentQuestionIndex = 0;
    State.isReviewMode = true;
    State.lastCompletedAttempt = attempt;
    window.location.hash = `#exam/${attempt.exam_id}`;
  },

  startRemediationQuiz() {
    const missedVault = Storage.getMissedQuestions();
    if (missedVault.length === 0) return;

    const drillExam = {
      exam_id: 999,
      title: `Remediation Drill (${missedVault.length} Questions)`,
      description: "Targeted drill session composed exclusively of questions you missed in prior exams.",
      time_limit_minutes: Math.max(15, Math.round(missedVault.length * 2.25)),
      questions: missedVault
    };

    initNewExamSession(drillExam);
    State.drillMode = 'vault';
    window.location.hash = '#exam/999';
  },

  startTopicDrill(topicInput) {
    let topic = topicInput;
    try {
      topic = decodeURIComponent(topicInput);
    } catch (e) {}
    const missedVault = Storage.getMissedQuestions().filter(q => q.topic === topic);
    if (missedVault.length === 0) {
      alert(`No missed questions found for topic: ${topic}. Good job!`);
      return;
    }
    const drillExam = {
      exam_id: 998,
      title: `Topic Drill: ${topic}`,
      description: `Targeted practice for ${topic} based on your past misses.`,
      time_limit_minutes: Math.max(10, Math.round(missedVault.length * 2.25)),
      questions: missedVault
    };
    initNewExamSession(drillExam);
    State.drillMode = 'topic';
    window.location.hash = '#exam/998';
  },

  removeFromVault(qId) {
    Storage.removeMissedQuestion(qId);
    renderVaultView();
  },

  exportMistakesLog() {
    const missedVault = Storage.getMissedQuestions();
    const md = Analytics.generateMistakesMarkdown(missedVault);
    
    // Robust clipboard fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(() => {
        alert(`Copied ${missedVault.length} missed question analysis blocks to clipboard!\nYou can paste directly into mistakes.md.`);
      }).catch(() => fallbackCopy(md));
    } else {
      fallbackCopy(md);
    }

    function fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert(`Copied ${missedVault.length} missed question analysis blocks to clipboard!\nYou can paste directly into mistakes.md.`);
      } catch (err) {
        // Direct download fallback
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mistakes_export.md';
        a.click();
      }
      document.body.removeChild(textarea);
    }
  }
};

// Delegated click listener for data-action attributes
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'topic-drill') {
    const topic = btn.dataset.topic;
    if (topic) window.App.startTopicDrill(topic);
  } else if (action === 'review-attempt') {
    const attId = btn.dataset.attemptId;
    if (attId) window.App.reviewAttemptAnswers(attId);
  } else if (action === 'remove-vault') {
    const qId = btn.dataset.questionId;
    if (qId) window.App.removeFromVault(qId);
  }
});

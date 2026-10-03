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
  isStudyMode: false,       // interactive study mode with immediate feedback
  checkedQuestions: {},     // { [qId]: { isCorrect: boolean, userAnswers: string[] } }
  studyElapsedSeconds: 0,   // count-up timer in study mode
  drillMode: null,          // null, 'vault', or 'topic'
  quickChecking: false      // true during 1-second visual feedback transition when pressing Next in study mode
};

let autoAdvanceTimeout = null;

function cancelAutoAdvance() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  State.quickChecking = false;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.EXAM_DATA) {
    State.allExams = window.EXAM_DATA.exams || [];
    State.sourcesMetadata = (window.EXAM_DATA && (window.EXAM_DATA.sources_metadata || window.EXAM_DATA.sources)) || null;
  }
  
  // Initialize Progressive Web App capabilities
  initPWA();

  // Set up Hash router
  window.addEventListener('hashchange', handleRouting);
  
  // Wall-clock sync on tab visibility change (timed exam mode only)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && State.timerEndTime && State.currentView === 'exam' && !State.isReviewMode && !State.isStudyMode) {
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
  cancelAutoAdvance();
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
    case 'diagnostics':
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
  const effectiveRoute = activeRoute === 'diagnostics' ? 'gaps' : activeRoute;
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.dataset.route;
    if (route === effectiveRoute) {
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
// SESSION & ACTIVE EXAM HELPERS
// -------------------------------------------------------------
function getActiveExamWithQuestions() {
  const savedActive = Storage.getActiveExam();
  if (!savedActive) return null;
  if (State.activeExam && State.activeExam.exam_id === savedActive.exam_id && State.activeExam.questions) {
    savedActive.questions = State.activeExam.questions;
  } else if (savedActive.drillQuestions) {
    savedActive.questions = savedActive.drillQuestions;
  } else if (savedActive.exam_id && State.allExams) {
    const match = State.allExams.find(e => e.exam_id === savedActive.exam_id);
    if (match) savedActive.questions = match.questions;
  }
  return savedActive;
}

function confirmOverwriteSession() {
  const savedActive = Storage.getActiveExam();
  if (savedActive && savedActive.exam_id) {
    const hasAnswers = (savedActive.userAnswers && Object.values(savedActive.userAnswers).some(a => Array.isArray(a) && a.length > 0)) ||
                       (savedActive.checkedQuestions && Object.keys(savedActive.checkedQuestions).length > 0);
    if (hasAnswers) {
      const modeLabel = savedActive.isStudyMode ? 'Study session' : 'Exam';
      const confirmMsg = `You have an in-progress ${modeLabel} for "${savedActive.exam_title || ('Exam #' + savedActive.exam_id)}". Starting a new session will discard your saved progress. Proceed?`;
      if (!confirm(confirmMsg)) {
        return false;
      }
      Storage.clearActiveExam();
    }
  }
  return true;
}

// -------------------------------------------------------------
// DASHBOARD VIEW
// -------------------------------------------------------------
function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  container.classList.remove('hidden');

  const attempts = Storage.getAttempts();
  const missedVault = Storage.getMissedQuestions();
  const savedActive = Storage.getActiveExam();
  const activeWithQuestions = getActiveExamWithQuestions();
  const diagnostic = Analytics.diagnoseGaps(attempts, missedVault, activeWithQuestions);

  // Resume Banner if an active exam exists in storage
  const resumeContainer = document.getElementById('resume-banner-container');
  if (savedActive && savedActive.exam_id) {
    const isStudy = Boolean(savedActive.isStudyMode);
    const answeredCount = Object.values(savedActive.userAnswers || {}).filter(a => Array.isArray(a) && a.length > 0).length;
    const totalQ = savedActive.drillQuestions ? savedActive.drillQuestions.length : 53;
    const timeInfo = isStudy
      ? `${Math.floor((savedActive.studyElapsedSeconds || 0) / 60)} minutes elapsed`
      : `${Math.floor((savedActive.timerSecondsRemaining ?? 7200) / 60)} minutes remaining`;

    resumeContainer.innerHTML = `
      <div class="p-5 rounded-2xl ${isStudy ? 'bg-amber-50/70 border-2 border-brand-terracotta-line' : 'bg-amber-50 border-2 border-amber-300'} flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full ${isStudy ? 'bg-brand-terracotta' : 'bg-amber-500'} shrink-0" aria-hidden="true"></span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-stone-900">Active ${isStudy ? 'Study' : 'Exam'} Session: ${escapeHtml(savedActive.exam_title || 'Mock Exam')}</h3>
              ${isStudy ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand-terracotta-tint text-brand-terracotta border border-brand-terracotta-line font-semibold">Study Mode</span>' : ''}
            </div>
            <p class="text-xs text-stone-600 font-sans">${answeredCount} of ${totalQ} answered · ${timeInfo}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.App.discardActiveExam()" class="px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition">
            Discard
          </button>
          <a href="#exam" class="px-4 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition flex items-center gap-1.5">
            <span>Resume ${isStudy ? 'Study' : 'Exam'}</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    `;
    resumeContainer.classList.remove('hidden');
  } else {
    resumeContainer.classList.add('hidden');
  }

  // Quick Diagnostic Strip (displayed if attempts exist, active questions tested, or missed questions in vault)
  const diagContainer = document.getElementById('dashboard-readiness-card');
  if (diagContainer) {
    const hasData = (diagnostic.full_attempts > 0) || (diagnostic.total_questions_tested > 0) || (missedVault.length > 0);
    if (hasData) {
      const summaryText = diagnostic.full_attempts > 0
        ? `<span class="font-semibold text-stone-900">${diagnostic.full_attempts}/10 Completed</span>`
        : `<span class="font-semibold text-stone-900">${diagnostic.total_questions_tested} Questions Evaluated</span>`;

      diagContainer.innerHTML = `
        <div class="px-4 py-3.5 rounded-xl bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-3 text-stone-700">
            ${summaryText}
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
    const isHardTier = exam.exam_id === 11 || exam.exam_id === 12;
    const isModerateTier = exam.exam_id >= 13 && exam.exam_id <= 15;

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

    let subtitle = '53 questions · 120 minutes';
    if (isHardTier) {
      subtitle = '53 questions · 120 min · High-difficulty subtle distractors (not from external mock dumps)';
    } else if (isModerateTier) {
      subtitle = '53 questions · 120 min · Realistic moderate-difficulty simulation (not from external mock dumps)';
    }

    row.innerHTML = `
      <span class="hidden sm:block font-editorial text-2xl leading-none text-stone-400 w-9 text-right shrink-0" aria-hidden="true">${formNum}</span>
      <div class="flex-1 min-w-[10rem]">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-editorial text-stone-900 leading-snug">Mock Exam #${exam.exam_id}</h3>
          ${isHardTier ? '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">Hard Tier · Scratch Authored</span>' : ''}
          ${isModerateTier ? '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-900 border border-sky-300">Moderate Tier · Scratch Authored</span>' : ''}
        </div>
        <p class="text-xs font-mono text-stone-500 mt-0.5">${subtitle}</p>
      </div>
      <div class="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5">
        ${bestAttempt ? `
          <button type="button" onclick="window.App.viewPreviousResult('${bestAttempt.id}')" class="text-xs font-mono text-stone-500 hover:text-stone-900 underline-offset-2 hover:underline transition">
            Score
          </button>
        ` : '<span aria-hidden="true"></span>'}
        <button type="button" onclick="window.App.startStudyExam(${exam.exam_id})" class="px-3 py-2 rounded-lg border border-stone-300 hover:border-brand-terracotta hover:text-brand-terracotta text-stone-700 text-xs font-semibold transition shrink-0" title="Study with instant feedback and rationale">
          Study
        </button>
        <button type="button" onclick="window.App.startExam(${exam.exam_id})" class="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition shrink-0" title="Timed practice exam">
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
          time_limit_minutes: savedActive.time_limit_minutes || Math.ceil((savedActive.timerSecondsRemaining ?? 7200) / 60),
          questions: savedActive.drillQuestions
        };
      }
      
      if (fullExam) {
        State.activeExam = fullExam;
        State.sessionId = savedActive.sessionId || (`sess_${fullExam.exam_id}_${Date.now()}`);
        State.currentQuestionIndex = savedActive.currentQuestionIndex || 0;
        State.userAnswers = savedActive.userAnswers || {};
        State.flaggedQuestions = new Set(savedActive.flaggedQuestions || []);
        State.timerSecondsRemaining = savedActive.timerSecondsRemaining ?? (fullExam.time_limit_minutes * 60);
        State.isStudyMode = Boolean(savedActive.isStudyMode);
        State.checkedQuestions = savedActive.checkedQuestions || {};
        State.studyElapsedSeconds = savedActive.studyElapsedSeconds || 0;
      } else {
        startFreshExam(paramId);
      }
    } else if (savedActive && paramId && parseInt(paramId) !== savedActive.exam_id) {
      // Confirm before overwriting saved in-progress exam
      if (confirmOverwriteSession()) {
        startFreshExam(paramId);
      } else {
        window.location.hash = savedActive.exam_id < 900 ? `#exam/${savedActive.exam_id}` : '#exam';
        return;
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

function startFreshExam(paramId, isStudy = false) {
  const idToLoad = paramId ? parseInt(paramId) : 1;
  const foundExam = State.allExams.find(e => e.exam_id === idToLoad);
  if (!foundExam) {
    window.location.hash = '#dashboard';
    return;
  }
  initNewExamSession(foundExam, isStudy);
}

function initNewExamSession(exam, isStudy = false) {
  if (State.timerInterval) {
    clearInterval(State.timerInterval);
    State.timerInterval = null;
  }
  cancelAutoAdvance();
  State.activeExam = exam;
  State.sessionId = `sess_${exam.exam_id}_${Date.now()}`;
  State.currentQuestionIndex = 0;
  State.userAnswers = {};
  State.flaggedQuestions = new Set();
  State.isStudyMode = Boolean(isStudy);
  State.checkedQuestions = {};
  State.studyElapsedSeconds = 0;
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
      timerSecondsRemaining: State.timerSecondsRemaining,
      time_limit_minutes: State.activeExam.time_limit_minutes,
      isStudyMode: State.isStudyMode,
      checkedQuestions: State.checkedQuestions,
      studyElapsedSeconds: State.studyElapsedSeconds,
      sessionId: State.sessionId
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
  const modeSuffix = State.isReviewMode ? ' (Review Mode)' : (State.isStudyMode ? ' (Study Mode)' : '');
  const isHardTier = exam.exam_id === 11 || exam.exam_id === 12;
  const isModerateTier = exam.exam_id >= 13 && exam.exam_id <= 15;
  document.getElementById('exam-title-header').textContent = exam.title + modeSuffix;
  document.getElementById('q-counter').textContent = `Question ${qNum} of ${totalQ}`;

  const hardBanner = document.getElementById('hard-tier-banner');
  if (hardBanner) {
    if (isHardTier) {
      hardBanner.classList.remove('hidden');
    } else {
      hardBanner.classList.add('hidden');
    }
  }

  const moderateBanner = document.getElementById('moderate-tier-banner');
  if (moderateBanner) {
    if (isModerateTier) {
      moderateBanner.classList.remove('hidden');
    } else {
      moderateBanner.classList.add('hidden');
    }
  }
  
  // Question Metadata Tags (Domain & Topic): visible in Study Mode and Review Mode, hidden during timed Exam Mode
  const tagsContainer = document.getElementById('question-tags-container');
  const showMetadataTags = Boolean(State.isStudyMode || State.isReviewMode);
  if (tagsContainer) {
    if (showMetadataTags) {
      tagsContainer.classList.remove('hidden');
      tagsContainer.classList.add('flex');
      const domainInfo = DOMAIN_METADATA[q.domain_id] || { name: q.domain_name, weight: 10 };
      const domainBadge = document.getElementById('domain-badge');
      if (domainBadge) domainBadge.textContent = `${q.domain_id}: ${domainInfo.name} (${domainInfo.weight}%)`;

      const topicBadge = document.getElementById('topic-badge');
      if (topicBadge) topicBadge.textContent = q.topic || 'Core Scenario';
    } else {
      tagsContainer.classList.add('hidden');
      tagsContainer.classList.remove('flex');
    }
  }

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
  const isQuestionChecked = State.isStudyMode && Boolean(State.checkedQuestions[q.id]);
  const inFeedbackMode = State.isReviewMode || isQuestionChecked;

  q.options.forEach(opt => {
    const isUserChoice = userSelected.includes(opt.key);
    const isCorrectChoice = q.correct_answers.includes(opt.key);
    const card = document.createElement('div');
    const inputId = `opt-${q.id}-${opt.key}`;

    let cardClasses = "p-4 rounded-xl border transition flex items-start gap-4 ";
    let radioDisabled = "";

    if (inFeedbackMode) {
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
    if (inFeedbackMode) {
      if (isCorrectChoice) {
        markerBadge = `<span class="ml-auto text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded whitespace-nowrap">✓ Correct</span>`;
      } else if (isUserChoice) {
        markerBadge = `<span class="ml-auto text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded whitespace-nowrap">✕ Your Choice</span>`;
      }
    }

    card.innerHTML = `
      <div class="mt-0.5 shrink-0">
        <input type="${isMultiple ? 'checkbox' : 'radio'}" id="${inputId}" name="question_opt" value="${opt.key}" ${isUserChoice ? 'checked' : ''} ${radioDisabled} class="cursor-pointer">
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

  // Review / Study mode explanation drawer (suppressed during quick-check auto-advance)
  const explanationBox = document.getElementById('explanation-drawer');
  if (inFeedbackMode && !State.quickChecking) {
    explanationBox.classList.remove('hidden');
    explanationBox.innerHTML = `
      <div class="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Answer</span>
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
  const clearBtn = document.getElementById('clear-q-btn');
  const checkBtn = document.getElementById('check-answer-btn');

  if (clearBtn) {
    if (inFeedbackMode || userSelected.length === 0) {
      clearBtn.classList.add('hidden');
    } else {
      clearBtn.classList.remove('hidden');
    }
  }

  if (checkBtn) {
    if (State.isStudyMode && !State.isReviewMode) {
      checkBtn.classList.remove('hidden');
      if (isQuestionChecked) {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Checked ✓';
        checkBtn.className = "px-4 py-2 rounded-lg bg-stone-100 text-stone-400 border border-stone-200 text-xs font-semibold cursor-default";
      } else if (userSelected.length > 0) {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check Answer';
        checkBtn.className = "px-4 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition cursor-pointer";
      } else {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Check Answer';
        checkBtn.className = "px-4 py-2 rounded-lg bg-stone-200 text-stone-400 text-xs font-semibold cursor-not-allowed";
      }
    } else {
      checkBtn.classList.add('hidden');
    }
  }

  prevBtn.disabled = State.currentQuestionIndex === 0 || State.quickChecking;
  prevBtn.className = (State.currentQuestionIndex === 0 || State.quickChecking)
    ? "px-4 py-2 rounded-lg text-xs font-medium text-stone-500 bg-stone-100 cursor-not-allowed"
    : "px-4 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition";

  if (State.quickChecking) {
    const qChecked = State.checkedQuestions[q.id];
    const isCorrect = qChecked && qChecked.isCorrect;
    nextBtn.disabled = true;
    if (isCorrect) {
      nextBtn.className = "px-5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-wait motion-safe:animate-pulse";
      nextBtn.innerHTML = `<span>✓ Correct</span> <span aria-hidden="true">&rarr;</span>`;
    } else {
      nextBtn.className = "px-5 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-wait motion-safe:animate-pulse";
      nextBtn.innerHTML = `<span>✕ Incorrect</span> <span aria-hidden="true">&rarr;</span>`;
    }
  } else if (State.currentQuestionIndex === totalQ - 1) {
    nextBtn.disabled = false;
    if (State.isReviewMode) {
      nextBtn.innerHTML = `<span>Back to Results</span> <span aria-hidden="true">&rarr;</span>`;
      nextBtn.className = "px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5";
    } else {
      nextBtn.innerHTML = `<span>Finish &amp; Review</span> <span aria-hidden="true">&rarr;</span>`;
      nextBtn.className = "px-5 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition flex items-center gap-1.5";
    }
  } else {
    nextBtn.disabled = false;
    nextBtn.innerHTML = `<span>Next Question</span> <span aria-hidden="true">&rarr;</span>`;
    nextBtn.className = "px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5";
  }

  // Hide submit and save buttons in sidebar, header, and mobile matrix during review
  const sidebarActions = document.getElementById('sidebar-exam-actions');
  if (sidebarActions) {
    if (State.isReviewMode) {
      sidebarActions.classList.add('hidden');
    } else {
      sidebarActions.classList.remove('hidden');
    }
  }
  const headerSave = document.getElementById('header-save-btn');
  if (headerSave) {
    if (State.isReviewMode) {
      headerSave.classList.add('hidden');
    } else {
      headerSave.classList.remove('hidden');
    }
  }
  const mobileMatrixActions = document.getElementById('mobile-matrix-actions');
  if (mobileMatrixActions) {
    if (State.isReviewMode) {
      mobileMatrixActions.classList.add('hidden');
    } else {
      mobileMatrixActions.classList.remove('hidden');
    }
  }
}

function handleOptionClick(q, optKey, isMultiple) {
  if (State.isReviewMode || (State.isStudyMode && State.checkedQuestions[q.id])) return;

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

function checkCurrentAnswer() {
  if (!State.isStudyMode || State.isReviewMode) return;
  const exam = State.activeExam;
  if (!exam) return;
  const q = exam.questions[State.currentQuestionIndex];
  if (!q) return;

  const userSel = State.userAnswers[q.id] || [];
  if (userSel.length === 0) return;

  const correctSel = q.correct_answers || [];
  const isCorrect = userSel.length === correctSel.length && userSel.every(k => correctSel.includes(k));

  State.checkedQuestions[q.id] = {
    isCorrect,
    userAnswers: [...userSel]
  };

  // Immediate sync to vault for diagnostics and practice
  if (!isCorrect) {
    Storage.addMissedQuestions([{
      ...q,
      exam_id: exam.exam_id,
      exam_title: exam.title,
      user_selected: userSel
    }], State.sessionId);
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

function advanceToNextQuestionOrFinish() {
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

function nextQuestion() {
  const exam = State.activeExam;
  if (!exam) return;

  const q = exam.questions[State.currentQuestionIndex];
  if (!q) return;

  const userSel = State.userAnswers[q.id] || [];
  const isAlreadyChecked = State.isStudyMode && Boolean(State.checkedQuestions[q.id]);

  // In Study Mode: If an answer is selected and not yet checked,
  // show immediate correctness feedback for ~1 second without opening the full explanation drawer,
  // then automatically advance to the next question.
  if (State.isStudyMode && !State.isReviewMode && userSel.length > 0 && !isAlreadyChecked) {
    if (autoAdvanceTimeout) return; // Prevent double trigger

    const correctSel = q.correct_answers || [];
    const isCorrect = userSel.length === correctSel.length && userSel.every(k => correctSel.includes(k));

    State.checkedQuestions[q.id] = {
      isCorrect,
      userAnswers: [...userSel]
    };
    State.quickChecking = true;

    // Immediate sync to vault for diagnostics and practice
    if (!isCorrect) {
      Storage.addMissedQuestions([{
        ...q,
        exam_id: exam.exam_id,
        exam_title: exam.title,
        user_selected: userSel
      }], State.sessionId);
    }

    saveCurrentSession();
    renderCurrentQuestion();
    renderQuestionMatrix();

    autoAdvanceTimeout = setTimeout(() => {
      autoAdvanceTimeout = null;
      State.quickChecking = false;
      advanceToNextQuestionOrFinish();
    }, 1000);
    return;
  }

  cancelAutoAdvance();
  advanceToNextQuestionOrFinish();
}

function prevQuestion() {
  cancelAutoAdvance();
  if (State.currentQuestionIndex > 0) {
    State.currentQuestionIndex--;
    saveCurrentSession();
    renderCurrentQuestion();
    renderQuestionMatrix();
  }
}

function goToQuestion(index) {
  cancelAutoAdvance();
  State.currentQuestionIndex = index;
  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

function clearCurrentAnswer() {
  const exam = State.activeExam;
  if (!exam || State.isReviewMode) return;
  const q = exam.questions[State.currentQuestionIndex];
  if (State.isStudyMode && State.checkedQuestions[q.id]) return;
  cancelAutoAdvance();
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

  let summaryText = `${answeredCount} of ${totalCount} answered · ${flaggedCount} flagged`;
  if (State.isStudyMode) {
    const checkedCount = Object.keys(State.checkedQuestions || {}).length;
    const correctCount = Object.values(State.checkedQuestions || {}).filter(c => c.isCorrect).length;
    summaryText = `${checkedCount} of ${totalCount} checked · ${correctCount} correct`;
  }

  const summaryEl = document.getElementById('matrix-summary-text');
  if (summaryEl) summaryEl.textContent = summaryText;
  const mobileSummaryEl = document.getElementById('mobile-matrix-summary-text');
  if (mobileSummaryEl) mobileSummaryEl.textContent = summaryText;

  const mobBtnLabel = document.getElementById('mobile-matrix-btn-label');
  if (mobBtnLabel) mobBtnLabel.textContent = `Grid (${totalCount})`;

  // Toggle Matrix Legends between Exam and Study modes
  const legendExam = document.getElementById('matrix-legend-exam');
  const legendStudy = document.getElementById('matrix-legend-study');
  const mobLegendExam = document.getElementById('mobile-matrix-legend-exam');
  const mobLegendStudy = document.getElementById('mobile-matrix-legend-study');
  if (legendExam && legendStudy) {
    if (State.isStudyMode) {
      legendExam.classList.add('hidden');
      legendStudy.classList.remove('hidden');
    } else {
      legendExam.classList.remove('hidden');
      legendStudy.classList.add('hidden');
    }
  }
  if (mobLegendExam && mobLegendStudy) {
    if (State.isStudyMode) {
      mobLegendExam.classList.add('hidden');
      mobLegendStudy.classList.remove('hidden');
    } else {
      mobLegendExam.classList.remove('hidden');
      mobLegendStudy.classList.add('hidden');
    }
  }

  if (matrixContainer) matrixContainer.innerHTML = '';
  if (mobileContainer) mobileContainer.innerHTML = '';

  exam.questions.forEach((q, idx) => {
    const isAnswered = State.userAnswers[q.id] && State.userAnswers[q.id].length > 0;
    const isFlagged = State.flaggedQuestions.has(q.id);
    const isCurrent = idx === State.currentQuestionIndex;

    let baseClasses = "rounded-lg text-xs font-mono flex items-center justify-center transition relative ";

    const checkedInfo = State.isStudyMode ? State.checkedQuestions[q.id] : null;

    if (State.isReviewMode || checkedInfo) {
      const isCorrect = checkedInfo ? checkedInfo.isCorrect : (
        (State.userAnswers[q.id] || []).length === (q.correct_answers || []).length &&
        (State.userAnswers[q.id] || []).every(k => (q.correct_answers || []).includes(k))
      );
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

  if (State.isStudyMode) {
    const studyStartTime = Date.now() - (State.studyElapsedSeconds || 0) * 1000;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
      State.studyElapsedSeconds = Math.max(0, Math.floor((Date.now() - studyStartTime) / 1000));
      updateTimerDisplay();

      if (State.studyElapsedSeconds % 30 === 0) {
        saveCurrentSession();
      }
    }, 1000);
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

  if (State.isStudyMode) {
    const elapsed = State.studyElapsedSeconds || 0;
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    const formatted = `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    el.textContent = `${formatted} (Study)`;
    el.className = "font-mono text-xs font-semibold text-stone-900";
    return;
  }

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
  cancelAutoAdvance();
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
  cancelAutoAdvance();
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
    mode: State.isStudyMode ? 'study' : 'exam',
    time_spent_seconds: State.isStudyMode
      ? (State.studyElapsedSeconds || 0)
      : (exam.time_limit_minutes * 60) - (State.timerSecondsRemaining ?? 0),
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
        <div class="flex items-center gap-2">
          <span class="text-xs font-editorial uppercase tracking-widest ${isPass ? 'text-emerald-800' : 'text-amber-800'} font-semibold">Official Score Report</span>
          ${attempt.mode === 'study' ? `<span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-terracotta-tint text-brand-terracotta border border-brand-terracotta-line">Study Mode</span>` : ''}
        </div>
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
  const activeWithQuestions = getActiveExamWithQuestions();
  const diagnostic = Analytics.diagnoseGaps(attempts, missedVault, activeWithQuestions);

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

      <!-- Recommendations -->
      ${diagnostic.recommendations && diagnostic.recommendations.length > 0 ? `
        <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1.5 font-sans">
          <strong class="font-semibold block text-stone-900 font-editorial uppercase tracking-wider text-[11px]">Recommended Study Focus:</strong>
          <ul class="list-disc list-inside space-y-1">
            ${diagnostic.recommendations.map(r => `<li>${escapeHtml(r).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

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
      ${diagnostic.top_topic_gaps && diagnostic.top_topic_gaps.length > 0 ? `
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
              <div class="pt-2 flex items-center justify-end gap-3">
                <button data-action="topic-study" data-topic="${escapeHtml(item.topic)}" class="text-xs font-semibold text-stone-600 hover:text-brand-terracotta">
                  Study Drill
                </button>
                <button data-action="topic-drill" data-topic="${escapeHtml(item.topic)}" class="text-xs font-semibold text-brand-terracotta hover:text-brand-terracotta-deep">
                  Timed Drill <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="p-6 rounded-2xl bg-white border border-stone-200 text-center space-y-2">
          <p class="text-stone-800 text-sm font-sans font-medium">No misconception topics recorded yet.</p>
          <p class="text-xs text-stone-500 font-sans">Any questions you answer incorrectly during mock exams or study mode will automatically be analyzed and surfaced here.</p>
        </div>
      `}
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
            <button onclick="window.App.startRemediationQuiz(true)" class="px-3.5 py-2 rounded-lg border border-brand-terracotta text-brand-terracotta hover:bg-brand-terracotta-tint text-xs font-semibold transition" title="Study with instant answers &amp; explanations">
              Study Drill (${missedVault.length})
            </button>
            <button onclick="window.App.startRemediationQuiz(false)" class="px-4 py-2 rounded-lg bg-brand-terracotta hover:bg-brand-terracotta-deep text-white text-xs font-semibold transition" title="Timed remediation drill">
              Timed Drill <span aria-hidden="true">&rarr;</span>
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
const SCRATCH_SOURCES = [
  {
    tier: "Moderate Tier",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
    exams: "Exams #13, #14 & #15",
    title: "Moderate Tier Practice Simulations",
    author: "Scratch Authored (CCDV-F Simulator)",
    repo: "vkr1729/ccdv-f-exam-simulator",
    url: "https://github.com/vkr1729/ccdv-f-exam-simulator",
    description: "Authored completely from scratch directly against official Anthropic CCDV-F blueprint specifications. Provides full-length 53-question moderate-difficulty simulations with realistic exam-style scenarios across all 8 domains and comprehensive technical explanations. Completely original and not sourced from external mock dumps.",
    contributed: 159,
    share: "20.0%"
  },
  {
    tier: "Hard Tier",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    exams: "Exams #11 & #12",
    title: "Hard Tier Practice Simulations",
    author: "Scratch Authored (CCDV-F Simulator)",
    repo: "vkr1729/ccdv-f-exam-simulator",
    url: "https://github.com/vkr1729/ccdv-f-exam-simulator",
    description: "Authored completely from scratch directly against official Anthropic CCDV-F blueprint specifications. Features elevated difficulty with subtle near-miss distractors and deep architectural edge cases, expanded with detailed rationales for every option. Completely original and not sourced from external mock dumps.",
    contributed: 106,
    share: "13.3%"
  }
];

const COMMUNITY_SOURCES = [
  {
    author: "Srinivas Pusuluri",
    repo: "srinipusuluri/CCDV-F-SET1",
    url: "https://github.com/srinipusuluri/CCDV-F-SET1",
    description: "Compiled an extensive 9-set collection of developer practice questions with detailed explanations and distractor reasoning.",
    contributed: 149,
    share: "18.7%"
  },
  {
    author: "Nat Sh.",
    repo: "natsh/claude-developer-foundations-prep",
    url: "https://github.com/natsh/claude-developer-foundations-prep",
    description: "Authored the comprehensive 5-module quiz bank based on the Anthropic Partner Academy curriculum plus advanced exam practice sets.",
    contributed: 132,
    share: "16.6%"
  },
  {
    author: "Turjoy Real",
    repo: "turjoy-real/CCDV-F",
    url: "https://github.com/turjoy-real/CCDV-F",
    description: "Created realistic 53-item practice mock exams and multi-domain developer practice scenario drills.",
    contributed: 88,
    share: "11.1%"
  },
  {
    author: "H. Bacheller",
    repo: "hbacheller-tribe/CCDV-F-Exam",
    url: "https://github.com/hbacheller-tribe/CCDV-F-Exam",
    description: "Engineered blueprint-weighted scenario questions with insightful technical rationales for real-world development patterns.",
    contributed: 85,
    share: "10.7%"
  },
  {
    author: "Amey Thakur",
    repo: "Amey-Thakur/CLAUDE-CERTIFICATIONS",
    url: "https://github.com/Amey-Thakur/CLAUDE-CERTIFICATIONS",
    description: "Developed comprehensive Developer Foundations question collections and timed practice exam modules.",
    contributed: 76,
    share: "9.6%"
  }
];

function renderSourcesView() {
  const container = document.getElementById('view-sources');
  container.classList.remove('hidden');

  const content = document.getElementById('sources-content');

  content.innerHTML = `
    <!-- Top Provenance & Attribution Header -->
    <div class="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-6">
      <div class="space-y-2">
        <span class="text-xs font-editorial uppercase tracking-widest text-brand-terracotta font-semibold">Attribution &amp; Provenance</span>
        <h2 class="text-2xl sm:text-3xl font-editorial text-stone-900">Question Bank Provenance &amp; Creator Attribution</h2>
        <p class="text-sm text-stone-600 leading-relaxed max-w-3xl">
          This platform synthesizes <strong>795 authentic scenario questions</strong> structured into <strong>15 full-length 53-question practice exams</strong> (120 minutes each). All questions strictly adhere to Anthropic's official 8-domain blueprint weights and have been verified for developer accuracy.
        </p>
      </div>

      <!-- Educational Synthesis & Anti-Plagiarism Statement -->
      <div class="p-5 rounded-xl bg-amber-50/70 border border-brand-terracotta-line space-y-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-brand-terracotta shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <h3 class="text-sm font-semibold text-stone-900 font-editorial">Educational Purpose &amp; Anti-Plagiarism Commitment</h3>
        </div>
        <p class="text-xs sm:text-sm text-stone-700 leading-relaxed">
          The objective of this exam simulator is <strong>educational synthesis and fair practice, not plagiarism</strong>. Studying from a single author often introduces authorial bias, repetitive question phrasing, and topical blind spots. This question bank combines two complementary pillars:
        </p>
        <ul class="text-xs sm:text-sm text-stone-700 space-y-1.5 list-disc pl-5">
          <li><strong>Base Practice Forms (Exams #1–#10 · 530 Questions)</strong>: Interleaved across 5 independent community study repositories so every form draws from multiple creators under official blueprint weights.</li>
          <li><strong>Scratch-Authored Forms (Exams #11–#15 · 265 Questions)</strong>: Authored completely from scratch directly against official Anthropic blueprints across Moderate Tier (#13, #14 &amp; #15) and Hard Tier (#11 &amp; #12) with elevated distractor plausibility and deep architectural explanations. None of these questions originate from public mock dumps.</li>
        </ul>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs font-mono text-stone-600 border-t border-brand-terracotta-line/50">
          <span>✓ 100% Free &amp; Open Source</span>
          <span>✓ Strict Creator Attribution</span>
          <span>✓ 265 Scratch-Authored Items</span>
          <span>✓ No NDA / Non-Public Exam Dumps</span>
          <span>✓ Educational Fair Use</span>
        </div>
      </div>

      <!-- Scratch-Authored Exams Section -->
      <div class="space-y-4 pt-2">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <h3 class="text-base font-semibold text-stone-900">Scratch-Authored Exam Forms (265 Questions Total · Exams #11–#15)</h3>
          <span class="text-xs font-mono text-stone-500">Authored from scratch against Anthropic CCDV-F blueprints</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${SCRATCH_SOURCES.map(src => `
            <div class="p-5 rounded-xl bg-white border border-stone-200 hover:border-brand-terracotta/40 shadow-sm transition flex flex-col justify-between space-y-3">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${src.badgeClass}">${escapeHtml(src.tier)} · Scratch Authored</span>
                      <span class="text-xs font-mono text-stone-500">${escapeHtml(src.exams)}</span>
                    </div>
                    <h4 class="text-base font-bold text-stone-900">${escapeHtml(src.title)}</h4>
                    <p class="text-xs font-mono text-stone-500 mt-0.5">${escapeHtml(src.repo)}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-xs font-mono bg-stone-100 text-stone-700 font-semibold border border-stone-200 shrink-0">
                    ${src.contributed} questions (${src.share})
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">${escapeHtml(src.description)}</p>
              </div>
              <div class="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span class="font-mono text-stone-500">100% Original Content</span>
                <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 font-semibold text-brand-terracotta hover:text-brand-terracotta-deep transition group">
                  <span>View Repository</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Heartfelt Community Thanks -->
      <div class="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
        <h3 class="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <span>A Sincere Thank You to Upstream Community Creators</span>
          <span class="text-base" aria-hidden="true">🙏</span>
        </h3>
        <p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
          We extend our heartfelt gratitude and deep appreciation to the independent developers and community educators who authored, curated, and openly shared practice questions for Exams #1–#10. Their generosity and dedication empower developers worldwide to master the Claude API and build production-ready applications. <strong>Please visit their repositories below, star their work, and review their original materials:</strong>
        </p>
      </div>

      <!-- Upstream Repositories Grid -->
      <div class="space-y-4 pt-2">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <h3 class="text-base font-semibold text-stone-900">Upstream Open-Source Repositories (530 Questions Total · Exams #1–#10)</h3>
          <span class="text-xs font-mono text-stone-500">Vetted community repositories</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${COMMUNITY_SOURCES.map(src => `
            <div class="p-5 rounded-xl bg-white border border-stone-200 hover:border-brand-terracotta/40 shadow-sm transition flex flex-col justify-between space-y-3">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-xs font-editorial uppercase tracking-wider text-brand-terracotta font-semibold">Author / Creator</span>
                    <h4 class="text-base font-bold text-stone-900">${escapeHtml(src.author)}</h4>
                    <p class="text-xs font-mono text-stone-500 mt-0.5">${escapeHtml(src.repo)}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-xs font-mono bg-stone-100 text-stone-700 font-semibold border border-stone-200 shrink-0">
                    ${src.contributed} questions (${src.share})
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">${escapeHtml(src.description)}</p>
              </div>
              <div class="pt-3 border-t border-stone-100">
                <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-terracotta hover:text-brand-terracotta-deep transition group">
                  <svg class="w-4 h-4 text-stone-600 group-hover:text-brand-terracotta transition shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                  <span>Visit ${escapeHtml(src.repo)}</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Multi-Source Distribution Breakdown Across All 15 Exams -->
      <div class="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
        <h3 class="text-sm font-semibold text-stone-900">Comprehensive Question Bank Distribution (795 Questions Total)</h3>
        <p class="text-xs text-stone-600 leading-relaxed">
          Every single 53-question mock exam in this simulator strictly adheres to Anthropic's official blueprint weights (Applications &amp; Integration: 33.1%, Model Selection: 16.8%, Agents &amp; Workflows: 14.7%, Prompt Engineering: 11.0%, Tools &amp; MCP: 10.6%, Security &amp; Safety: 8.1%, Claude Code: 3.1%, Eval &amp; Testing: 2.6%).
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 text-center text-xs font-mono">
          <div class="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
            <div class="font-bold text-sky-950">159</div>
            <div class="text-[10px] text-sky-800 truncate" title="Moderate Tier · Scratch Authored (Exams 13-15)">Moderate Tier (20%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-stone-200">
            <div class="font-bold text-stone-900">149</div>
            <div class="text-[10px] text-stone-500 truncate" title="Srinivas Pusuluri">Srinipusuluri (19%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-stone-200">
            <div class="font-bold text-stone-900">132</div>
            <div class="text-[10px] text-stone-500 truncate" title="Nat Sh.">Nat Sh. (17%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <div class="font-bold text-amber-950">106</div>
            <div class="text-[10px] text-amber-800 truncate" title="Hard Tier · Scratch Authored (Exams 11-12)">Hard Tier (13%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-stone-200">
            <div class="font-bold text-stone-900">88</div>
            <div class="text-[10px] text-stone-500 truncate" title="Turjoy Real">Turjoy Real (11%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-stone-200">
            <div class="font-bold text-stone-900">85</div>
            <div class="text-[10px] text-stone-500 truncate" title="H. Bacheller">H. Bacheller (11%)</div>
          </div>
          <div class="p-2.5 rounded-lg bg-white border border-stone-200">
            <div class="font-bold text-stone-900">76</div>
            <div class="text-[10px] text-stone-500 truncate" title="Amey Thakur">Amey Thakur (10%)</div>
          </div>
        </div>
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

let toastTimeoutId = null;

function showToast(message, duration = 3000) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-mono shadow-2xl flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none translate-y-2';
    document.body.appendChild(toast);
  }
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
  }
  toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span><span>${escapeHtml(message)}</span>`;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
  toastTimeoutId = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
    toastTimeoutId = null;
  }, duration);
}

function syncStudyMissedToVault() {
  const exam = State.activeExam;
  if (!exam || !State.isStudyMode) return;
  const missedList = [];
  exam.questions.forEach(q => {
    const checked = State.checkedQuestions[q.id];
    if (checked && !checked.isCorrect) {
      missedList.push({
        ...q,
        exam_id: exam.exam_id,
        exam_title: exam.title,
        user_selected: checked.userAnswers || []
      });
    }
  });
  if (missedList.length > 0) {
    Storage.addMissedQuestions(missedList, State.sessionId);
  }
}

function saveAndExitExam() {
  cancelAutoAdvance();
  const exam = State.activeExam;
  if (!exam || State.isReviewMode) {
    window.location.hash = '#dashboard';
    return;
  }

  // Ensure any wrong answers checked in study mode are captured in the vault
  syncStudyMissedToVault();

  // Save current active session
  saveCurrentSession();

  // Close any open modals
  closeSubmitModal();
  toggleMobileMatrix(false);

  // Navigate to dashboard
  window.location.hash = '#dashboard';

  // Show friendly toast confirmation
  showToast('Progress saved! You can resume anytime from the dashboard.');
}

// Global API object attached to window.App
window.App = {
  startExam(examId) {
    const exam = State.allExams.find(e => e.exam_id === examId);
    if (!exam) return;
    if (!confirmOverwriteSession()) return;
    initNewExamSession(exam, false);
    window.location.hash = `#exam/${examId}`;
  },

  startStudyExam(examId) {
    const exam = State.allExams.find(e => e.exam_id === examId);
    if (!exam) return;
    if (!confirmOverwriteSession()) return;
    initNewExamSession(exam, true);
    window.location.hash = `#exam/${examId}`;
  },

  discardActiveExam() {
    Storage.clearActiveExam();
    State.activeExam = null;
    renderDashboard();
  },

  saveAndExitExam,
  nextQuestion,
  prevQuestion,
  checkCurrentAnswer,
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

  startRemediationQuiz(isStudy = false) {
    const missedVault = Storage.getMissedQuestions();
    if (missedVault.length === 0) return;

    const drillExam = {
      exam_id: 999,
      title: `Remediation Drill (${missedVault.length} Questions)`,
      description: "Targeted drill session composed exclusively of questions you missed in prior exams.",
      time_limit_minutes: Math.max(15, Math.round(missedVault.length * 2.25)),
      questions: missedVault
    };

    initNewExamSession(drillExam, isStudy);
    State.drillMode = 'vault';
    window.location.hash = '#exam/999';
  },

  startTopicDrill(topicInput, isStudy = false) {
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
    initNewExamSession(drillExam, isStudy);
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
    if (topic) window.App.startTopicDrill(topic, false);
  } else if (action === 'topic-study') {
    const topic = btn.dataset.topic;
    if (topic) window.App.startTopicDrill(topic, true);
  } else if (action === 'review-attempt') {
    const attId = btn.dataset.attemptId;
    if (attId) window.App.reviewAttemptAnswers(attId);
  } else if (action === 'remove-vault') {
    const qId = btn.dataset.questionId;
    if (qId) window.App.removeFromVault(qId);
  }
});

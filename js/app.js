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
  userAnswers: {},     // { [qId]: ['A', 'C'] }
  flaggedQuestions: new Set(),
  timerSecondsRemaining: 120 * 60,
  timerInterval: null,
  lastCompletedAttempt: null,
  isReviewMode: false, // when reviewing a finished exam
  drillMode: null      // null, 'vault', or 'domain'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.EXAM_DATA) {
    State.allExams = window.EXAM_DATA.exams || [];
    State.sourcesMetadata = window.EXAM_DATA.sources || null;
  }
  
  // Set up Hash router
  window.addEventListener('hashchange', handleRouting);
  
  // Check if there is an in-progress active exam in localStorage
  const savedActive = Storage.getActiveExam();
  if (savedActive && savedActive.exam) {
    // Show resume banner on dashboard
  }

  // Initial Route
  handleRouting();
});

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

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavUI(activeRoute) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.dataset.route;
    if (route === activeRoute) {
      link.className = "nav-link px-3.5 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-stone-900 border border-amber-200 transition shadow-xs";
    } else {
      link.className = "nav-link px-3.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition";
    }
  });

  // Update quick stats in header
  const attempts = Storage.getAttempts();
  const statsEl = document.getElementById('header-stats-pill');
  if (statsEl) {
    if (attempts.length === 0) {
      statsEl.textContent = "10 Mock Exams · 530 Questions Ready";
    } else {
      const avg = Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length);
      const passedCount = attempts.filter(a => a.is_passing).length;
      statsEl.textContent = `Completed: ${attempts.length} · Avg: ${avg}% (${passedCount} passed)`;
    }
  }
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

  // Resume Banner if an active exam exists
  const activeExamState = Storage.getActiveExam();
  const resumeContainer = document.getElementById('resume-banner-container');
  if (activeExamState && activeExamState.exam) {
    const answeredCount = Object.keys(activeExamState.userAnswers || {}).length;
    resumeContainer.innerHTML = `
      <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <span class="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Active Exam in Progress: ${activeExamState.exam.title}</h3>
            <p class="text-xs text-stone-600 font-sans">${answeredCount} of ${activeExamState.exam.questions.length} answered · ${Math.floor(activeExamState.timerSecondsRemaining / 60)} minutes remaining</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="window.App.discardActiveExam()" class="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition">
            Discard
          </button>
          <a href="#exam" class="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5">
            <span>Resume Exam</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>
    `;
    resumeContainer.classList.remove('hidden');
  } else {
    resumeContainer.classList.add('hidden');
  }

  // Diagnostic Summary Card
  const diagContainer = document.getElementById('dashboard-readiness-card');
  if (diagContainer) {
    diagContainer.innerHTML = `
      <div class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">Certification Readiness</span>
            <h2 class="text-xl font-editorial text-stone-900">CCDV-F Readiness Assessment</h2>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${diagnostic.total_attempts > 0 ? (diagnostic.average_score >= 72 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200') : 'bg-stone-100 text-stone-700 border border-stone-200'}">
              ${diagnostic.readiness_level}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div class="text-xs text-stone-500 font-sans">Full Exams Taken</div>
            <div class="text-2xl font-editorial text-stone-900 font-normal mt-1">${diagnostic.total_attempts} / 10</div>
          </div>
          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div class="text-xs text-stone-500 font-sans">Average Score</div>
            <div class="text-2xl font-editorial text-stone-900 font-normal mt-1">${diagnostic.average_score}%</div>
          </div>
          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div class="text-xs text-stone-500 font-sans">Missed Questions in Vault</div>
            <div class="text-2xl font-editorial text-amber-700 font-normal mt-1">${missedVault.length}</div>
          </div>
          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div class="text-xs text-stone-500 font-sans">Passing Threshold</div>
            <div class="text-2xl font-editorial text-stone-900 font-normal mt-1">720 / 1000</div>
          </div>
        </div>

        <div class="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div class="flex items-center space-x-2">
            <span class="font-medium text-stone-800">Primary Focus:</span>
            <span>${diagnostic.recommendations[0] || 'Take a mock exam to diagnose your baseline.'}</span>
          </div>
          <div class="flex space-x-2">
            <a href="#gaps" class="text-amber-800 hover:text-amber-900 font-medium underline">
              View Detailed Gap Analysis &rarr;
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 10 Mock Exam Cards Grid
  const gridContainer = document.getElementById('exam-cards-grid');
  gridContainer.innerHTML = '';

  State.allExams.forEach(exam => {
    const bestAttempt = Storage.getExamBestScore(exam.exam_id);
    const card = document.createElement('div');
    card.className = "p-6 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-300 transition duration-200 flex flex-col justify-between space-y-5";

    let statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono bg-stone-100 text-stone-600 border border-stone-200">Not Attempted</span>`;
    if (bestAttempt) {
      if (bestAttempt.is_passing) {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Passed: ${bestAttempt.percentage}% (${bestAttempt.scaled_score}/1000)</span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">Attempted: ${bestAttempt.percentage}% (${bestAttempt.scaled_score}/1000)</span>`;
      }
    }

    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-amber-800 font-semibold uppercase tracking-wider">Form #${exam.exam_id}</span>
          ${statusBadge}
        </div>
        <h3 class="text-xl font-editorial text-stone-900 font-normal leading-snug">${exam.title}</h3>
        <p class="text-xs text-stone-600 leading-relaxed font-sans">${exam.description}</p>
        
        <div class="pt-2 flex flex-wrap gap-1.5 text-xs font-mono text-stone-500">
          <span class="px-2 py-0.5 bg-stone-100 rounded">53 Questions</span>
          <span class="px-2 py-0.5 bg-stone-100 rounded">120 Minutes</span>
          <span class="px-2 py-0.5 bg-stone-100 rounded">8 Domains Weighted</span>
        </div>
      </div>

      <div class="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
        ${bestAttempt ? `
          <button onclick="window.App.viewPreviousResult('${bestAttempt.id}')" class="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition">
            Review Score
          </button>
        ` : '<div></div>'}
        <button onclick="window.App.startExam(${exam.exam_id})" class="px-4 py-2 rounded-lg bg-stone-900 hover:bg-amber-800 text-white text-xs font-semibold shadow transition">
          ${bestAttempt ? 'Retake Exam' : 'Begin Exam'} &rarr;
        </button>
      </div>
    `;
    gridContainer.appendChild(card);
  });
}

// -------------------------------------------------------------
// EXAM RUNNER VIEW
// -------------------------------------------------------------
function renderExamRunner(examId) {
  const container = document.getElementById('view-exam');
  container.classList.remove('hidden');

  // If starting fresh or resuming
  if (!State.activeExam) {
    const idToLoad = examId ? parseInt(examId) : 1;
    const foundExam = State.allExams.find(e => e.exam_id === idToLoad);
    if (!foundExam) {
      window.location.hash = '#dashboard';
      return;
    }
    initNewExamSession(foundExam);
  }

  // Setup UI for current question
  renderCurrentQuestion();
  renderQuestionMatrix();
  startTimer();
}

function initNewExamSession(exam) {
  State.activeExam = exam;
  State.currentQuestionIndex = 0;
  State.userAnswers = {};
  State.flaggedQuestions = new Set();
  State.timerSecondsRemaining = (exam.time_limit_minutes || 120) * 60;
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
  document.getElementById('exam-title-header').textContent = exam.title;
  document.getElementById('q-counter').textContent = `Question ${qNum} of ${totalQ}`;
  
  const domainInfo = DOMAIN_METADATA[q.domain_id] || { name: q.domain_name, weight: 10 };
  const domainBadge = document.getElementById('domain-badge');
  domainBadge.textContent = `${q.domain_id}: ${domainInfo.name} (${domainInfo.weight}%)`;

  const topicBadge = document.getElementById('topic-badge');
  topicBadge.textContent = q.topic || 'Core Scenario';

  // Flag state
  const isFlagged = State.flaggedQuestions.has(q.id);
  const flagBtn = document.getElementById('flag-btn');
  if (isFlagged) {
    flagBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5";
    flagBtn.innerHTML = `<span>★</span><span>Flagged</span>`;
  } else {
    flagBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center space-x-1.5 transition";
    flagBtn.innerHTML = `<span>☆</span><span>Flag for Review</span>`;
  }

  // Question Prompt (formatted with code if needed)
  const promptEl = document.getElementById('question-prompt');
  promptEl.innerHTML = formatPromptText(q.prompt);

  // Question Type Guidance
  const typeGuidance = document.getElementById('question-type-guidance');
  if (q.type === 'multiple' || (q.correct_answers && q.correct_answers.length > 1)) {
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
    const isChecked = userSelected.includes(opt.key);
    const card = document.createElement('div');
    const isMultiple = q.type === 'multiple' || (q.correct_answers && q.correct_answers.length > 1);

    card.className = `p-4 rounded-xl border transition cursor-pointer flex items-start space-x-4 ${
      isChecked 
        ? 'border-2 border-amber-700 bg-amber-50/70 shadow-xs' 
        : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
    }`;

    card.onclick = () => handleOptionClick(q, opt.key, isMultiple);

    card.innerHTML = `
      <div class="mt-0.5">
        <input type="${isMultiple ? 'checkbox' : 'radio'}" name="question_opt" ${isChecked ? 'checked' : ''} class="h-4 w-4 text-amber-700 focus:ring-amber-500 border-stone-300 rounded${isMultiple ? '' : '-full'}">
      </div>
      <div class="flex-1">
        <span class="font-serif font-bold text-sm ${isChecked ? 'text-amber-900' : 'text-stone-700'} mr-2">${opt.key}.</span>
        <span class="text-sm ${isChecked ? 'text-stone-900 font-medium' : 'text-stone-800'} leading-relaxed font-sans">${escapeHtml(opt.text)}</span>
      </div>
    `;
    optionsContainer.appendChild(card);
  });

  // Review mode / Explanation drawer if reviewing
  const explanationBox = document.getElementById('explanation-drawer');
  if (State.isReviewMode) {
    explanationBox.classList.remove('hidden');
    explanationBox.innerHTML = `
      <div class="p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-amber-900">Answer Key & Official Rationale</span>
          <span class="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800">Correct: ${q.correct_answers.join(', ')}</span>
        </div>
        <p class="text-sm text-stone-800 leading-relaxed font-sans">${escapeHtml(q.explanation)}</p>
        ${q.distractor_explanations && Object.keys(q.distractor_explanations).length > 0 ? `
          <div class="pt-2 border-t border-amber-200/60 text-xs text-stone-600 space-y-1">
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
    ? "px-4 py-2 rounded-lg text-xs font-medium text-stone-400 bg-stone-100 cursor-not-allowed"
    : "px-4 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition";

  if (State.currentQuestionIndex === totalQ - 1) {
    nextBtn.innerHTML = `<span>Finish & Review</span> <span>&rarr;</span>`;
    nextBtn.className = "px-5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5";
  } else {
    nextBtn.innerHTML = `<span>Next Question</span> <span>&rarr;</span>`;
    nextBtn.className = "px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5";
  }
}

function handleOptionClick(q, optKey, isMultiple) {
  if (State.isReviewMode) return; // read only during review

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

  State.userAnswers[q.id] = current;
  saveCurrentSession();
  renderCurrentQuestion();
  renderQuestionMatrix();
}

function toggleFlag() {
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
    openSubmitModal();
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
  if (!matrixContainer) return;
  matrixContainer.innerHTML = '';

  const answeredCount = Object.keys(State.userAnswers).length;
  const flaggedCount = State.flaggedQuestions.size;
  const totalCount = exam.questions.length;

  document.getElementById('matrix-summary-text').textContent = `${answeredCount} of ${totalCount} answered · ${flaggedCount} flagged`;

  exam.questions.forEach((q, idx) => {
    const isAnswered = State.userAnswers[q.id] && State.userAnswers[q.id].length > 0;
    const isFlagged = State.flaggedQuestions.has(q.id);
    const isCurrent = idx === State.currentQuestionIndex;

    const btn = document.createElement('button');
    btn.onclick = () => goToQuestion(idx);

    let classes = "w-8 h-8 rounded-lg text-xs font-mono flex items-center justify-center transition relative ";

    if (isCurrent) {
      classes += "ring-2 ring-amber-700 font-bold bg-amber-100 text-amber-900 ";
    } else if (isAnswered) {
      classes += "bg-stone-800 text-white font-medium ";
    } else {
      classes += "bg-stone-100 text-stone-600 hover:bg-stone-200 ";
    }

    if (isFlagged) {
      classes += "border-2 border-amber-500 ";
    }

    btn.className = classes;
    btn.innerHTML = `${idx + 1}${isFlagged ? '<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>' : ''}`;
    matrixContainer.appendChild(btn);
  });
}

// Timer Logic
function startTimer() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  if (State.isReviewMode) {
    document.getElementById('timer-display').textContent = 'Review Mode';
    return;
  }

  updateTimerDisplay();
  State.timerInterval = setInterval(() => {
    if (State.timerSecondsRemaining > 0) {
      State.timerSecondsRemaining--;
      updateTimerDisplay();
      if (State.timerSecondsRemaining % 30 === 0) {
        saveCurrentSession();
      }
    } else {
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
  const exam = State.activeExam;
  if (!exam) return;

  const total = exam.questions.length;
  const answered = Object.keys(State.userAnswers).length;
  const unanswered = total - answered;
  const flagged = State.flaggedQuestions.size;

  const modal = document.getElementById('submit-modal');
  modal.classList.remove('hidden');

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
  document.getElementById('submit-modal').classList.add('hidden');
}

function finishExam() {
  closeSubmitModal();
  pauseTimer();

  const exam = State.activeExam;
  const evalResult = Analytics.evaluateExam(exam, State.userAnswers);

  const attempt = {
    exam_id: exam.exam_id,
    exam_title: exam.title,
    time_spent_seconds: (exam.time_limit_minutes * 60) - State.timerSecondsRemaining,
    ...evalResult
  };

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

  scoreCard.className = `p-8 rounded-2xl border ${isPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/50 border-amber-300'} shadow-sm space-y-6`;
  scoreCard.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="text-xs font-serif uppercase tracking-widest ${isPass ? 'text-emerald-800' : 'text-amber-800'} font-semibold">Official Score Report</span>
        <h2 class="text-3xl font-editorial text-stone-900">${attempt.exam_title}</h2>
        <p class="text-xs text-stone-600 mt-1">Completed on ${new Date(attempt.date).toLocaleString()} · Duration: ${Math.floor((attempt.time_spent_seconds || 0) / 60)} minutes</p>
      </div>
      <div class="px-5 py-2.5 rounded-xl font-mono text-center ${isPass ? 'bg-emerald-600 text-white shadow-md' : 'bg-amber-700 text-white shadow-md'}">
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
          <div class="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-stone-900">[${d.id}] ${d.name} (${d.weight}%)</span>
              <span class="font-mono ${d.percentage >= 72 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}">${d.correct}/${d.total} (${d.percentage}%)</span>
            </div>
            <div class="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full ${d.percentage >= 72 ? 'bg-emerald-600' : 'bg-amber-600'}" style="width: ${d.percentage}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="pt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex space-x-3">
        <button onclick="window.App.reviewExamAnswers(${attempt.exam_id})" class="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow transition">
          Review Question Explanations &rarr;
        </button>
        <a href="#vault" class="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition">
          View Missed Questions Vault (${attempt.missed_questions.length})
        </a>
      </div>
      <a href="#dashboard" class="text-xs text-stone-600 hover:text-stone-900 font-medium">
        &larr; Back to All Exams
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
    <div class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">Diagnostic Engine</span>
          <h2 class="text-2xl font-editorial text-stone-900">Lagging Areas & Misconception Analysis</h2>
          <p class="text-xs text-stone-600 mt-1">Identifies specific technical blindspots across your practice exams so you can study with surgical precision.</p>
        </div>
        <button onclick="window.App.exportMistakesLog()" class="px-3.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium shadow-2xs transition flex items-center space-x-1.5">
          <span>📋</span>
          <span>Copy mistakes.md</span>
        </button>
      </div>

      <!-- Domain Rankings Table -->
      <div class="pt-4 border-t border-stone-200">
        <h3 class="text-sm font-semibold text-stone-900 mb-3">Domain Performance vs. 72% Passing Threshold:</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-sans">
            <thead>
              <tr class="border-b border-stone-200 text-stone-500 font-medium">
                <th class="py-2">Domain</th>
                <th class="py-2">Weight</th>
                <th class="py-2">Questions Seen</th>
                <th class="py-2">Accuracy</th>
                <th class="py-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              ${diagnostic.domain_rankings.map(d => `
                <tr class="${d.is_lagging && d.total > 0 ? 'bg-amber-50/50' : ''}">
                  <td class="py-2.5 font-medium text-stone-900">[${d.id}] ${d.name}</td>
                  <td class="py-2.5 text-stone-600 font-mono">${d.weight}%</td>
                  <td class="py-2.5 text-stone-600 font-mono">${d.total}</td>
                  <td class="py-2.5 font-mono ${d.percentage >= 72 ? 'text-emerald-700 font-bold' : (d.total === 0 ? 'text-stone-400' : 'text-amber-800 font-bold')}">${d.total > 0 ? d.percentage + '%' : '–'}</td>
                  <td class="py-2.5">
                    ${d.total === 0 ? '<span class="text-stone-400">Untested</span>' : (d.percentage >= 72 ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">Pass</span>' : '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-medium">Lagging Focus</span>')}
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
            <div class="flex items-center justify-between">
              <h4 class="text-base font-semibold text-stone-900">${item.topic}</h4>
              <span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-100 text-amber-900 border border-amber-200">${item.count} misses</span>
            </div>
            ${item.guide ? `
              <p class="text-xs text-stone-700 leading-relaxed font-sans">${item.guide.summary}</p>
              <div class="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                <strong>Watch out for:</strong> ${item.guide.traps}
              </div>
            ` : '<p class="text-xs text-stone-500 font-sans">Review missed questions in this category using the Vault.</p>'}
            <div class="pt-2 flex justify-end">
              <button onclick="window.App.startTopicDrill('${item.topic}')" class="text-xs font-semibold text-amber-800 hover:text-amber-900">
                Drill Missed Questions in this Topic &rarr;
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
    <div class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">Spaced Repetition & Revision</span>
          <h2 class="text-2xl font-editorial text-stone-900">Missed Questions Vault</h2>
          <p class="text-xs text-stone-600 mt-1">Every question you missed across all exam attempts is preserved here for focused revision.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${missedVault.length > 0 ? `
            <button onclick="window.App.startRemediationQuiz()" class="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow transition">
              🎯 Start Remediation Quiz (${missedVault.length}) &rarr;
            </button>
          ` : ''}
          <button onclick="window.App.exportMistakesLog()" class="px-3.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition">
            Export to mistakes.md
          </button>
        </div>
      </div>
    </div>

    <!-- Questions List -->
    <div class="space-y-4">
      ${missedVault.length === 0 ? `
        <div class="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 space-y-3">
          <div class="text-3xl">🎉</div>
          <h4 class="text-lg font-editorial text-stone-900">Your Vault is Empty!</h4>
          <p class="text-xs text-stone-600 max-w-md mx-auto">Take a mock exam from the dashboard. Any questions you answer incorrectly will automatically appear here for targeted review.</p>
          <div class="pt-2">
            <a href="#dashboard" class="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold shadow">Go to Mock Exams &rarr;</a>
          </div>
        </div>
      ` : missedVault.map((q, idx) => `
        <div class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-md font-mono font-semibold bg-amber-100 text-amber-900 border border-amber-200">[${q.domain_id}] ${q.domain_name}</span>
              <span class="text-stone-500 font-mono">${q.topic || 'General'}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-stone-400 font-mono">Missed ${q.miss_count || 1} time${(q.miss_count || 1) > 1 ? 's' : ''}</span>
              <button onclick="window.App.removeFromVault('${q.id}')" class="text-stone-400 hover:text-stone-600 text-xs font-mono" title="Remove from vault">✕</button>
            </div>
          </div>

          <p class="text-base font-editorial text-stone-900 leading-relaxed font-normal">${escapeHtml(q.prompt)}</p>

          <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-2">
            <div class="flex items-center space-x-2">
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
    <div class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
      <span class="text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">Attribution & Open Source Provenance</span>
      <h2 class="text-2xl font-editorial text-stone-900">Question Bank Provenance & Attribution</h2>
      <p class="text-xs text-stone-600 leading-relaxed max-w-3xl">
        This platform synthesizes 530 authentic scenario questions balanced into 10 full 53-question exams. All questions are sourced from open developer study repositories, mapped to the official CCDV-F domain blueprint weights, and verified for accuracy.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
        ${meta.sources.map(src => `
          <div class="p-5 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-stone-900 font-mono">${src.name}</h4>
              <span class="px-2 py-0.5 rounded-full text-xs font-mono bg-stone-200 text-stone-700 font-medium">${src.contributed_questions} questions</span>
            </div>
            <p class="text-xs text-stone-600 font-sans leading-relaxed">${src.description}</p>
            <div class="pt-2">
              <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-amber-800 hover:text-amber-900 underline flex items-center space-x-1">
                <span>View on GitHub</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// UTILITY FUNCTIONS & EXPORT HANDLERS
// -------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPromptText(text) {
  if (!text) return '';
  // Convert markdown code ticks to <code> tags
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-100 text-amber-900 text-xs font-mono font-medium">$1</code>');
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
  clearCurrentAnswer,
  openSubmitModal,
  closeSubmitModal,
  finishExam,

  viewPreviousResult(attemptId) {
    window.location.hash = `#results/${attemptId}`;
  },

  reviewExamAnswers(examId) {
    const exam = State.allExams.find(e => e.exam_id === examId);
    if (!exam) return;
    State.activeExam = exam;
    State.currentQuestionIndex = 0;
    State.isReviewMode = true;
    window.location.hash = `#exam/${examId}`;
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

  startTopicDrill(topic) {
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
    navigator.clipboard.writeText(md).then(() => {
      alert(`Copied ${missedVault.length} missed question analysis blocks to clipboard!\nYou can paste directly into mistakes.md.`);
    }).catch(err => {
      console.error('Failed to copy', err);
      // Fallback download
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mistakes_export.md';
      a.click();
    });
  }
};

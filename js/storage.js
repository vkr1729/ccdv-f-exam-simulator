/**
 * storage.js
 * Persistent client-side data layer for CCDV-F Exam Simulator
 * Uses localStorage to persist attempts, in-progress exams, and missed questions vault.
 */

const STORAGE_KEYS = {
  ATTEMPTS: 'ccdv_f_attempts',
  ACTIVE_EXAM: 'ccdv_f_active_exam',
  MISSED_VAULT: 'ccdv_f_missed_vault',
  USER_SETTINGS: 'ccdv_f_settings'
};

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`localStorage.setItem failed for key "${key}":`, e);
    return false;
  }
}

export const Storage = {
  // --- Exam Attempts History ---
  getAttempts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading attempts from localStorage', e);
      return [];
    }
  },

  saveAttempt(attempt) {
    let attempts = this.getAttempts();
    attempt.id = 'att_' + Date.now();
    attempt.date = new Date().toISOString();
    attempts.unshift(attempt); // latest first

    // Quota management: Cap history to keep at most 20 full exams and 10 drills
    const fullExams = [];
    const drills = [];
    for (const a of attempts) {
      if (a.exam_id !== undefined && a.exam_id >= 900) {
        if (drills.length < 10) drills.push(a);
      } else {
        if (fullExams.length < 20) fullExams.push(a);
      }
    }
    // Recombine preserved attempts sorted newest first
    attempts = [...fullExams, ...drills].sort((a, b) => new Date(b.date) - new Date(a.date));

    let saved = safeSetItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    if (!saved) {
      // Emergency quota trimming: drop all but last 5 full and 2 drills
      const trimmed = attempts.filter(a => a.exam_id < 900).slice(0, 5);
      safeSetItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(trimmed));
    }
    
    // Automatically record missed questions to the vault
    if (attempt.missed_questions && attempt.missed_questions.length > 0) {
      this.addMissedQuestions(attempt.missed_questions);
    }
    return attempt;
  },

  getExamBestScore(examId) {
    const attempts = this.getAttempts().filter(a => a.exam_id === examId);
    if (!attempts.length) return null;
    return attempts.reduce((best, curr) => curr.percentage > best.percentage ? curr : best, attempts[0]);
  },

  // --- In-Progress Active Exam State ---
  getActiveExam() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveActiveExam(state) {
    // Only store minimal necessary data to prevent quota bloat:
    // don't duplicate full question definitions if exam_id is 1-10
    const minimalState = {
      exam_id: state.exam ? state.exam.exam_id : null,
      exam_title: state.exam ? state.exam.title : '',
      currentQuestionIndex: state.currentQuestionIndex || 0,
      userAnswers: state.userAnswers || {},
      flaggedQuestions: Array.isArray(state.flaggedQuestions) ? state.flaggedQuestions : Array.from(state.flaggedQuestions || []),
      timerSecondsRemaining: state.timerSecondsRemaining ?? 7200,
      drillQuestions: (state.exam && state.exam.exam_id >= 900) ? state.exam.questions : null,
      isStudyMode: Boolean(state.isStudyMode),
      checkedQuestions: state.checkedQuestions || {},
      studyElapsedSeconds: state.studyElapsedSeconds || 0
    };
    safeSetItem(STORAGE_KEYS.ACTIVE_EXAM, JSON.stringify(minimalState));
  },

  clearActiveExam() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
    } catch (e) {}
  },

  // --- Missed Questions Vault ---
  getMissedQuestions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISSED_VAULT);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addMissedQuestions(questions) {
    const vault = this.getMissedQuestions();
    const vaultMap = new Map(vault.map(q => [q.id, q]));

    for (const q of questions) {
      if (vaultMap.has(q.id)) {
        const existing = vaultMap.get(q.id);
        existing.miss_count = (existing.miss_count || 1) + 1;
        existing.last_missed = new Date().toISOString();
        existing.user_selected = q.user_selected;
      } else {
        vaultMap.set(q.id, {
          ...q,
          miss_count: 1,
          added_at: new Date().toISOString(),
          last_missed: new Date().toISOString(),
          mastered: false
        });
      }
    }
    const updated = Array.from(vaultMap.values());
    safeSetItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(updated));
    return updated;
  },

  // Mark questions mastered or remove them after a successful remediation drill
  clearMasteredQuestions(questionIds) {
    if (!questionIds || questionIds.length === 0) return;
    const idSet = new Set(questionIds);
    const vault = this.getMissedQuestions().filter(q => !idSet.has(q.id));
    safeSetItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(vault));
    return vault;
  },

  removeMissedQuestion(questionId) {
    const vault = this.getMissedQuestions().filter(q => q.id !== questionId);
    safeSetItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(vault));
    return vault;
  },

  clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
      localStorage.removeItem(STORAGE_KEYS.MISSED_VAULT);
    } catch (e) {}
  }
};

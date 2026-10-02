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
    const attempts = this.getAttempts();
    attempt.id = 'att_' + Date.now();
    attempt.date = new Date().toISOString();
    attempts.unshift(attempt); // latest first
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    
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
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM, JSON.stringify(state));
  },

  clearActiveExam() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
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
    localStorage.setItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(updated));
    return updated;
  },

  removeMissedQuestion(questionId) {
    const vault = this.getMissedQuestions().filter(q => q.id !== questionId);
    localStorage.setItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(vault));
    return vault;
  },

  toggleMastered(questionId) {
    const vault = this.getMissedQuestions().map(q => {
      if (q.id === questionId) {
        return { ...q, mastered: !q.mastered };
      }
      return q;
    });
    localStorage.setItem(STORAGE_KEYS.MISSED_VAULT, JSON.stringify(vault));
    return vault;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_EXAM);
    localStorage.removeItem(STORAGE_KEYS.MISSED_VAULT);
  }
};

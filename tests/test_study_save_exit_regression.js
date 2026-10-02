/**
 * test_study_save_exit_regression.js
 * Automated regression test suite for CCDV-F Exam Simulator
 * Verifies:
 * 1. Vault miss_count session idempotency (no inflation across check, next, save, and submit)
 * 2. Analytics.diagnoseGaps accuracy with activeExam questions & drillQuestions
 * 3. Elimination of phantom totals from vault misses
 * 4. Preservation of time_limit_minutes and sessionId in active exam storage
 */

import { Storage } from '../js/storage.js';
import { Analytics } from '../js/analytics.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error('FAIL: ' + message);
    throw new Error(message);
  } else {
    passed++;
    console.log('PASS: ' + message);
  }
}

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};

console.log('=== RUNNING STUDY & SAVE/EXIT REGRESSION TESTS ===');

// --- Test 1: Vault Idempotency ---
console.log('[Suite 1: Vault Session Idempotency]');
const q = { id: 'q_test_1', question_text: 'Test question', domain_id: 'D1', topic_id: 'T1' };
const sess1 = 'sess_1_123';

// First call in session 1
Storage.addMissedQuestions([q], sess1);
let vault = Storage.getMissedQuestions();
assert(vault.length === 1 && vault[0].miss_count === 1, 'Question added with miss_count=1');

// Second call in session 1 (e.g. Next quick-check or Save & Exit)
Storage.addMissedQuestions([q], sess1);
vault = Storage.getMissedQuestions();
assert(vault[0].miss_count === 1, 'miss_count not incremented on second check in same session');

// Third call in session 1 (e.g. submit exam)
Storage.addMissedQuestions([q], sess1);
vault = Storage.getMissedQuestions();
assert(vault[0].miss_count === 1, 'miss_count not incremented on submit in same session');

// Fourth call in session 2 (new session attempt)
const sess2 = 'sess_2_456';
Storage.addMissedQuestions([q], sess2);
vault = Storage.getMissedQuestions();
assert(vault[0].miss_count === 2, 'miss_count increments to 2 only on subsequent session');

// --- Test 2: In-Progress Gap Diagnostics ---
console.log('[Suite 2: Gap Diagnostics Ingestion]');
const q1 = { id: 'q1', domain_id: 'D1', topic: 'API Mechanics' };
const q2 = { id: 'q2', domain_id: 'D2', topic: 'Model Selection' };

const activeExam = {
  exam_id: 1,
  questions: [q1, q2],
  checkedQuestions: {
    q1: { isCorrect: true, userAnswers: ['A'] },
    q2: { isCorrect: false, userAnswers: ['B'] }
  }
};

const missedVault = [
  { id: 'q2', domain_id: 'D2', topic: 'Model Selection', miss_count: 1 }
];

const diag = Analytics.diagnoseGaps([], missedVault, activeExam);
assert(diag.total_questions_tested === 2, 'Evaluates exact 2 in-progress tested questions');
assert(diag.average_score === 50, 'Computes 50% accuracy for 1 correct and 1 wrong');
assert(diag.readiness_level === 'In Progress (50%)', 'Sets readiness level to In Progress (50%)');
assert(diag.lagging_domains.length === 1 && diag.lagging_domains[0].id === 'D2', 'Identifies D2 as lagging domain');

// Test 3: Drill Active Exam Support
console.log('[Suite 3: Drill Active Exam Support]');
const drillActive = {
  exam_id: 901,
  drillQuestions: [q1, q2],
  checkedQuestions: {
    q1: { isCorrect: true, userAnswers: ['A'] }
  }
};
const diagDrill = Analytics.diagnoseGaps([], [], drillActive);
assert(diagDrill.total_questions_tested === 1, 'Supports drillQuestions property on activeExam');
assert(diagDrill.average_score === 100, 'Calculates 100% accuracy for drill');

// Test 4: Storage Active Exam State Shape
console.log('[Suite 4: Active Exam Storage Shape]');
Storage.saveActiveExam({
  exam: { exam_id: 1, title: 'Mock Exam 1', time_limit_minutes: 120 },
  currentQuestionIndex: 2,
  userAnswers: { q1: ['A'] },
  flaggedQuestions: ['q1'],
  timerSecondsRemaining: 7100,
  isStudyMode: true,
  checkedQuestions: { q1: { isCorrect: true } },
  studyElapsedSeconds: 100,
  sessionId: 'sess_1_custom'
});

const restored = Storage.getActiveExam();
assert(restored.exam_id === 1, 'Restores exam_id correctly');
assert(restored.time_limit_minutes === 120, 'Preserves time_limit_minutes');
assert(restored.sessionId === 'sess_1_custom', 'Preserves sessionId');
assert(restored.isStudyMode === true, 'Preserves isStudyMode');
assert(restored.studyElapsedSeconds === 100, 'Preserves studyElapsedSeconds');

console.log('========================================');
console.log('ALL ' + passed + ' REGRESSION CHECKS PASSED! (' + failed + ' failed)');
console.log('========================================');

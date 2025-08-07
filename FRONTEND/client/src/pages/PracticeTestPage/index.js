export const ZOOM_CONSTANTS = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3,
  ZOOM_STEP: 0.2,
  DEFAULT_ZOOM: 1,
};

export const QUESTION_TYPE = {
  AUDIO_ONLY: ['Part 1', 'Part 2'],
  SCRIPT_AND_QUESTION: ['Part 3', 'Part 4'],
  TEXT_ONLY: ['Part 5', 'Part 6', 'Part 7'],
  WITH_TRANSLATION: ['Part 6', 'Part 7'],
  WITH_GROUP_HEADING: ['Part 3', 'Part 4', 'Part 6', 'Part 7'],
};

export const DEFAULT_LANGUAGE = {
  ID: 1,
  NAME: 'Vietnamese',
};

export const STORAGE_KEYS = {
  TEST_PROGRESS: (testId) => `testProgress-${testId}`,
  TEST_TIME: (testId) => `testTime-${testId}`,
  TEST_SESSION: (testId) => `testSession-${testId}`,
  HAS_SUBMITTED: 'hasSubmitted',
  TIME_LIMIT: 'timeLimit',
};

export const TEST_TYPES = {
  PRACTICE: 'Practice',
  FULL: 'Full',
};

export const API_ENDPOINTS = {
  // Test data endpoints
  QUESTIONS: '/tests/questions',
  PARTS: '/tests/part',
  MEDIA: (testId) => `/tests/${testId}/media`,
  ANSWERS: '/tests/answer',
  TEST_PARTS: '/tests/testpart',
  TESTS: '/tests',
  LANGUAGES: '/languages',

  // Translation endpoints
  TRANSLATION_GET: '/translation/translate',
  TRANSLATION_POST: '/translation/translate',

  // History/Progress endpoints
  HISTORY: '/history',
  HISTORY_SAVED: (userId, testId) => `/history/saved?user_id=${userId}&test_id=${testId}`,
};

export const AUDIO_BASE_URL = 'https://11.11.4.138:8000/media';

export const LOADING_STEPS = {
  INITIAL: 10,
  QUESTIONS: 30,
  PARTS: 50,
  GROUPS: 60,
  ANSWERS: 70,
  TEST_PARTS: 80,
  TESTS: 90,
  COMPLETE: 100,
};

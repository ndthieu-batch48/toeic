import log from 'loglevel';

import { AppError, formatAxiosError } from '../utils/errorUtil';

export function setLogLevel(level = 'TRACE') {
  log.setLevel(level);
}

/**
 * Define a descriptive context key here when adding new features.
 * This helps make logs more readable and easier to trace.
 */
export const APP_LOG_CONTEXT = {
  // General api service
  GET: 'GET REQUEST',
  POST: 'POST REQUEST',
  PUT: 'PUT REQUEST',
  PATCH: 'PATCH REQUEST',
  DELETE: 'DELETE REQUEST',

  // Gemini service
  GEMINI: 'GEMINI REQUEST',
  CHATBOT: 'CHATBOT REQUEST',

  // Auth service
  AUTH_CONTEXT: 'AUTH CONTEXT',
  LOGIN: 'LOGIN REQUEST',
  LOGOUT: 'LOGOUT REQUEST',
  REGISTER: 'REGISTER REQUEST',
  REFRESH_TOKEN: 'REFRESH TOKEN REQUEST',

  // Userservices
  USER_GET: 'USER GET REQUEST',
  USER_GET_DETAIL: 'USER GET DETAIL REQUEST',
  USER_POST: 'USER POST REQUEST',
  USER_DELETE: 'USER DELETE REQUEST',
};

export const APP_LOG_LEVELS = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Validate the context key
function validateContext(context) {
  if (!APP_LOG_CONTEXT[context]) {
    throw new Error(`[Logger] Invalid context: "${context}". Use APP_LOG_CONTEXT enum.`);
  }
}

// Fallback formatter
function formatPayload(payload) {
  if (payload === null || payload === undefined) return { payload: 'No payload' };
  if (typeof payload === 'string') return { message: payload };
  if (typeof payload === 'object') return payload;
  return { value: String(payload) };
}

function _logFactory(context, level, message = 'No message', payload) {
  validateContext(context);
  const formattedPayload = formatPayload(payload);

  log[level](`[${context}] ${message}`, formattedPayload);
}

/**
 * Logs a general informational message with optional context and data.
 *
 * @param {string} context - A required context string, must be a value from APP_LOG_CONTEXT.
 *                           This helps identify the source or purpose of the log.
 * @param {string} [message='No message'] - A descriptive message to include in the log output.
 * @param {any} [data=null] - Optional additional data or payload to log (e.g., object, string, etc.).
 * @returns {void}
 */
export function logInfo(context, message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.INFO, context, message, data);
}

/**
 * Logs a debug message for development purposes.
 *
 * @param {string} context - A required context string, must be a value from APP_LOG_CONTEXT.
 *                           Useful for tracing specific parts of code during debugging.
 * @param {string} [message='No message'] - A descriptive debug message.
 * @param {any} [data=null] - Optional debugging data (variables, objects, state, etc.).
 * @returns {void}
 */
export function logDebug(context, message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.DEBUG, context, message, data);
}

/**
 * Logs a warning message with optional context and data.
 *
 * @param {string} context - A required context string, must be a value from APP_LOG_CONTEXT.
 *                           Helps identify the source of the warning.
 * @param {string} [message='No message'] - A warning message to describe what might be wrong.
 * @param {any} [data=null] - Optional additional details or metadata relevant to the warning.
 * @returns {void}
 */
export function logWarn(context, message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.DEBUG, context, message, data);
}

/**
 * Logs an error message along with error details.
 *
 * @param {string} context - A required context string, must be a value from APP_LOG_CONTEXT.
 *                           Helps identify where the error occurred.
 * @param {string} [message='No message'] - A custom error message for readability in logs.
 * @param {any} error - The actual error object (can be AppError, AxiosError, or standard Error).
 * @returns {void}
 */
export function logError(context, message = 'No message', error = null) {
  validateContext(context);
  if (!error) {
    _logFactory(APP_LOG_LEVELS.ERROR, context, message, error);
    return;
  }

  if (error instanceof AppError) {
    _logFactory(APP_LOG_LEVELS.ERROR, context, message, {
      context: error.context,
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack,
      raw: error.raw,
    });
  } else if (error.code || error.response || error.request) {
    const formattedError = formatAxiosError(error);
    _logFactory(APP_LOG_LEVELS.ERROR, context, message, {
      name: 'AxiosError',
      message: formattedError.message,
      status: formattedError.status,
      code: formattedError.code,
      stack: error.stack,
      raw: error,
    });
  } else {
    _logFactory(APP_LOG_LEVELS.ERROR, context, message, {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack || 'No stack trace',
    });
  }
}

export default log;

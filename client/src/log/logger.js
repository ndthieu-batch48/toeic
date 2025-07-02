import log from 'loglevel';

import { AppError, formatAxiosError } from '../utils/errorUtil';

export function setLogLevel(level = 'TRACE') {
  log.setLevel(level);
}

const APP_LOG_LEVELS = {
  TRACE: 'trace', // Use lowercase to match loglevel's method names
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// Fallback formatter
function formatPayload(payload) {
  if (payload === null || payload === undefined) return { payload: 'No payload' };
  if (typeof payload === 'string') return { message: payload };
  if (typeof payload === 'object') return payload;
  return { value: String(payload) };
}

function _logFactory(level, context, message = 'No message', payload) {
  const formattedPayload = formatPayload(payload);
  log[level](`[${context.toUpperCase()}] ${message}`, formattedPayload);
}

/**
 * Logs a general informational message with optional context and data.
 *
 * @param {string} context - A required context string. This helps identify the source or purpose of the log.
 * @param {string} [message='No message'] - A descriptive message to include in the log output.
 * @param {any} [data=null] - Optional additional data or payload to log (e.g., object, string, etc.).
 * @returns {void}
 */
export function logInfo(context = 'INFO', message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.INFO, context, message, data);
}

/**
 * Logs a debug message for development purposes.
 *
 * @param {string} context - A required context string. Useful for tracing specific parts of code during debugging.
 * @param {string} [message='No message'] - A descriptive debug message.
 * @param {any} [data=null] - Optional debugging data (variables, objects, state, etc.).
 * @returns {void}
 */
export function logDebug(context = 'DEBUG', message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.DEBUG, context, message, data);
}

/**
 * Logs a warning message with optional context and data.
 *
 * @param {string} context - A required context string. Helps identify the source of the warning.
 * @param {string} [message='No message'] - A warning message to describe what might be wrong.
 * @param {any} [data=null] - Optional additional details or metadata relevant to the warning.
 * @returns {void}
 */
export function logWarn(context = 'WARN', message = 'No message', data = null) {
  _logFactory(APP_LOG_LEVELS.WARN, context, message, data); // Fixed: was using DEBUG instead of WARN
}

/**
 * Logs an error message along with error details.
 *
 * @param {string} context - A required context string. Helps identify where the error occurred.
 * @param {string} [message='No message'] - A custom error message for readability in logs.
 * @param {any} error - The actual error object (can be AppError, AxiosError, or standard Error).
 * @returns {void}
 */
export function logError(context = 'ERROR', message = 'No message', error = null) {
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

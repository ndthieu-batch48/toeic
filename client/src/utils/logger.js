import log from 'loglevel';

import { AppError, formatAxiosError } from '../utils/errorHandler';

log.setLevel('TRACE');

// TODO: Define a descriptive context key here when adding new features.
// This helps make logs more readable and easier to trace.
export const APP_LOG_CONTEXT = {
  // General api service
  GET: 'GET REQUEST',
  POST: 'POST REQUEST',
  PUT: 'PUT REQUEST',
  PATCH: 'PATCH REQUEST',
  DELETE: 'DELETE REQUEST',

  // Gemini service
  GEMINI: 'GEMINI REQUEST',

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

// Helper function to format data/data consistently
function formatData(data) {
  if (data === null || data === undefined) {
    return {};
  }
  if (typeof data === 'string') {
    return { message: data };
  }
  if (typeof data === 'object') {
    return data;
  }
  return { value: String(data) }; // For other types (number, boolean, etc.), convert to string
}

export function logInfo(context, message, data) {
  const formattedData = formatData(data);
  log.info(`[INFO] [${context}] ${message}`, formattedData);
}

export function logError(context, message, error) {
  if (!error) {
    return;
  }

  if (error instanceof AppError) {
    log.error(`[ERROR] [${context}] ${message}`, {
      context: error.context,
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack,
      raw: error.raw,
    });
  } else if (error.code || error.response || error.request) {
    // Handle Axios errors using formatAxiosError
    const formattedError = formatAxiosError(error);
    log.error(`[ERROR] [${context}] ${message}`, {
      name: 'AxiosError',
      message: formattedError.message,
      status: formattedError.status,
      code: formattedError.code,
      stack: error.stack,
      raw: error,
    });
  } else {
    // Handle standard Error objects and other error types
    log.error(`[ERROR] [${context}] ${message}`, {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
      ...error,
    });
  }
}

export function logDebug(context, message, data) {
  const formattedData = formatData(data);
  log.debug(`[DEBUG] [${context}] ${message}`, formattedData);
}

export function logWarn(context, message, data) {
  const formattedData = formatData(data);
  log.warn(`[WARN] [${context}] ${message}`, formattedData);
}

// Auth-specific logging
export function logAuth(action, data) {
  const formattedData = formatData(data);
  logInfo('AUTH', `${action}`, formattedData);
}
export function logAuthError(action, error) {
  logError('AUTH', `${action} failed`, error);
}

// API-specific logging
export function logAPI(method, url, status, data) {
  const formattedData = formatData(data);
  logInfo('API', `${method} ${url} - ${status}`, formattedData);
}
export function logAPIError(method, url, error) {
  logError('API', `${method} ${url} failed`, error);
}

export default log;

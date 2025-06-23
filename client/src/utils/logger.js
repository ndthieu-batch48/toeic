import log from 'loglevel';

import { HttpCustomError, UnexpectedCustomError } from '../utils/errorHandler';

log.setLevel('TRACE');

export const APP_LOG_CONTEXT = {
  GET: 'GET REQUEST',
  POST: 'POST REQUEST',
  PUT: 'PUT REQUEST',
  PATCH: 'PATCH REQUEST',
  DELETE: 'DELETE REQUEST',
  GEMINI: 'GEMINI REQUEST',
  LOGIN: 'LOGIN REQUEST',
  LOGOUT: 'LOGOUT REQUEST',
  REGISTER: 'REGISTER REQUEST',
  REFRESH_TOKEN: 'REFRESH TOKEN REQUEST',
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
    log.error(`[ERROR] [${context}] ${message}`);
    return;
  }

  // Handle custom error classes (HttpCustomError, UnexpectedCustomError)
  if (error instanceof HttpCustomError) {
    log.error(`[ERROR] [${context}] ${message}`, {
      context: error.context,
      name: error.name,
      stack: error.stack,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      url: error.url,
      method: error.method,
      data: error.data,
      response: error.response,
      raw: error.raw,
    });
  } else if (error instanceof UnexpectedCustomError) {
    log.error(`[ERROR] [${context}] ${message}`, {
      name: error.name,
      message: error.message,
      context: error.context,
      stack: error.stack,
      raw: error.raw,
    });
  } else {
    // Handle standard Error objects and other error types
    log.error(`[ERROR] [${context}] ${message}`, {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
      ...error, // Spread any additional properties
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

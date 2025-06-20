import log from 'loglevel';

log.setLevel('TRACE');

export function logInfo(component, message, data = {}) {
  log.info(`[INFO] [${component}] ${message}`, data);
}

export function logError(component, message, error = null, data = {}) {
  if (!error) {
    log.error(`[ERROR] [${component}] ${message}`, data);
  }
  log.error(`[ERROR] [${component}] ${message}`, {
    error: error.message,
    stack: error.stack,
    ...data,
  });
}

export function logDebug(component, message, data = {}) {
  log.debug(`[DEBUG] [${component}] ${message}`, data);
}

export function logWarn(component, message, data = {}) {
  log.warn(`[WARN] [${component}] ${message}`, data);
}

// Auth-specific logging
export function logAuth(action, details = {}) {
  logInfo('AUTH', `${action}`, details);
}
export function logAuthError(action, error, details = {}) {
  logError('AUTH', `${action} failed`, error, details);
}

// API-specific logging
export function logAPI(method, url, status, data = {}) {
  logInfo('API', `${method} ${url} - ${status}`, data);
}
export function logAPIError(method, url, error, data = {}) {
  logError('API', `${method} ${url} failed`, error, data);
}

export default log;

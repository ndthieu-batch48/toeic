import { APP_LOG_CONTEXT, logError, logInfo } from './logger';

export const logService = {
  // Auth logs
  logAuthSuccess: (action, data) => logInfo(APP_LOG_CONTEXT.AUTH_CONTEXT, action, data),

  logAuthError: (action, error) =>
    logError(APP_LOG_CONTEXT.AUTH_CONTEXT, `${action} failed`, error),

  // General API logs
  logApiPostSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.POST, `${url} - ${status}`, data),

  logApiPostError: (url, error) => logError(APP_LOG_CONTEXT.POST, `${url} failed`, error),

  logApiGetSuccess: (url, status, data) => logInfo(APP_LOG_CONTEXT.GET, `${url} - ${status}`, data),

  logApiGetError: (url, error) => logError(APP_LOG_CONTEXT.GET, `${url} failed`, error),

  logApiDeleteSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.DELETE, `${url} - ${status}`, data),

  logApiDeleteError: (url, error) => logError(APP_LOG_CONTEXT.DELETE, `${url} failed`, error),

  // User API logs
  logUserPostSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.USER_POST, `${url} - ${status}`, data),

  logUserPostError: (url, error) => logError(APP_LOG_CONTEXT.USER_POST, `${url} failed`, error),

  logUserGetSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.USER_GET, `${url} - ${status}`, data),

  logUserGetError: (url, error) => logError(APP_LOG_CONTEXT.USER_GET, `${url} failed`, error),

  logUserGetDetailSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.USER_GET_DETAIL, `${url} - ${status}`, data),

  logUserGetDetailError: (url, error) =>
    logError(APP_LOG_CONTEXT.USER_GET_DETAIL, `${url} failed`, error),

  logUserDeleteSuccess: (url, status, data) =>
    logInfo(APP_LOG_CONTEXT.USER_DELETE, `${url} - ${status}`, data),

  logUserDeleteError: (url, error) => logError(APP_LOG_CONTEXT.USER_DELETE, `${url} failed`, error),
};

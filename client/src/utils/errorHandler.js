import {
  HTTP_STATUS,
  STATUS_ERROR_MAP,
  AUTH_ERRORS,
  NETWORK_ERRORS,
  FORM_ERRORS,
  COMMON_ERRORS,
  ERROR_TYPE,
} from '../constants/messages';

// Maps HTTP status codes to appropriate error messages
export const getErrorMessageByStatus = (status, context = 'general') => {
  switch (context) {
    case 'auth':
      return getAuthErrorMessage(status);
    case 'network':
      return getNetworkErrorMessage(status);
    default:
      return STATUS_ERROR_MAP[status] || COMMON_ERRORS.UNKNOWN_ERROR;
  }
};

// Gets authentication-specific error messages
export const getAuthErrorMessage = (status) => {
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return AUTH_ERRORS.LOGIN_FAILED;
    case HTTP_STATUS.CONFLICT:
      return FORM_ERRORS.USERNAME_TAKEN;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return AUTH_ERRORS.TOO_MANY_LOGIN_ATTEMPTS;
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return FORM_ERRORS.REQUIRED_FIELDS;
    case HTTP_STATUS.FORBIDDEN:
      return AUTH_ERRORS.UNAUTHORIZED_ACCESS;
    default:
      return STATUS_ERROR_MAP[status] || AUTH_ERRORS.LOGIN_FAILED;
  }
};

// Gets network-specific error messages
export const getNetworkErrorMessage = (status) => {
  if (status === 0) {
    return NETWORK_ERRORS.NETWORK_ERROR;
  }

  switch (status) {
    case HTTP_STATUS.REQUEST_TIMEOUT:
      return NETWORK_ERRORS.TIMEOUT_ERROR;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.GATEWAY_TIMEOUT:
      return NETWORK_ERRORS.SERVER_ERROR;
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return NETWORK_ERRORS.SERVICE_UNAVAILABLE;
    default:
      return STATUS_ERROR_MAP[status] || NETWORK_ERRORS.REQUEST_FAILED;
  }
};

// Determines error category based on status code and context
export const getErrorType = (status = 'general') => {
  if (status === 0) return ERROR_TYPE.NETWORK;
  if (status >= 500) return ERROR_TYPE.SERVER;
  if (status === HTTP_STATUS.UNAUTHORIZED) return ERROR_TYPE.AUTHENTICATION;
  if (status === HTTP_STATUS.FORBIDDEN) return ERROR_TYPE.AUTHORIZATION;
  if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY || status === HTTP_STATUS.BAD_REQUEST) {
    return ERROR_TYPE.VALIDATION;
  }
  if (status >= 400) return ERROR_TYPE.CLIENT;
  return ERROR_TYPE.UNKNOWN;
};

// Creates a standardized error objects
export const createError = (status, message, context = 'general') => {
  const type = getErrorType(status, context);

  return {
    status,
    message: message || getErrorMessageByStatus(status, context),
    type: type,
    context,
    timestamp: new Date().toISOString(),
  };
};

export const createNetworkError = (message = null) => {
  return createError(0, message || NETWORK_ERRORS.NETWORK_ERROR, 'network');
};

export const createAuthError = (status, message = null) => {
  return createError(status, message || getAuthErrorMessage(status), 'auth');
};

export const createValidationError = (message = null) => {
  return createError(
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    message || FORM_ERRORS.REQUIRED_FIELDS,
    'form'
  );
};

export const createServerError = (status = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = null) => {
  return createError(status, message || NETWORK_ERRORS.SERVER_ERROR, 'network');
};

export const handleAxiosError = (error, context = 'general') => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const serverMessage = data?.message || data?.detail || data?.error;
    const message = serverMessage || getErrorMessageByStatus(status, context);

    return createError(status, message, context);
  } else if (error.request) {
    // Network error - no response received
    return createNetworkError();
  } else {
    // Other error (configuration, etc.)
    return createError(500, error.message || COMMON_ERRORS.UNKNOWN_ERROR, context);
  }
};

export const isNetworkError = (error) => {
  return error.status === 0 || error.type === ERROR_TYPE.NETWORK;
};

export const isAuthError = (error) => {
  return error.status === HTTP_STATUS.UNAUTHORIZED || error.type === ERROR_TYPE.AUTHENTICATION;
};

export const isValidationError = (error) => {
  return (
    error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY ||
    error.status === HTTP_STATUS.BAD_REQUEST ||
    error.type === ERROR_TYPE.VALIDATION
  );
};

export const isServerError = (error) => {
  return error.status >= 500 || error.type === ERROR_TYPE.SERVER;
};

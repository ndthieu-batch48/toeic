export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const AUTH_ERRORS = {
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource.',
  TOKEN_REFRESH_FAILED: 'Unable to refresh session. Please log in again.',
  TOKEN_REFRESH_EXPIRED: 'Unable to refresh session. Token refresh expired.',
  TOKEN_REFRESH_NOT_FOUND: 'Can not find refresh token from local storage',
};

export const AUTH_SUCCESS = {
  LOGIN_SUCCESS: 'Login successful! Welcome back.',
  REGISTER_SUCCESS: 'Registration successful! Please login.',
};

export const FORM_ERRORS = {
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
};

export const COMMON_ERRORS = {
  NOT_FOUND: 'Service not found.',
  INVALID_REQUEST: 'Invalid request. Please check your input or request url.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
};

export const getHttpErrorMessage = (statusCode) => {
  switch (statusCode) {
    case 400:
      return COMMON_ERRORS.INVALID_REQUEST;
    case 401:
      return AUTH_ERRORS.INVALID_CREDENTIALS;
    case 403:
      return AUTH_ERRORS.UNAUTHORIZED_ACCESS;
    case 404:
      return COMMON_ERRORS.NOT_FOUND;
    case 500:
      return COMMON_ERRORS.SERVER_ERROR;
    default:
      return COMMON_ERRORS.UNKNOWN_ERROR;
  }
};

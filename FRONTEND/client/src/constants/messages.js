export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const AXIOS_ERROR_CODES = {
  CANCELED: 'ERR_CANCELED',
  NETWORK: 'ERR_NETWORK',
  TIMEOUT: 'ECONNABORTED',
  BAD_REQUEST: 'ERR_BAD_REQUEST',
  BAD_RESPONSE: 'ERR_BAD_RESPONSE',
  CONNECTION_REFUSED: 'ECONNREFUSED',
  CONNECTION_RESET: 'ECONNRESET',
  NOT_FOUND: 'ENOTFOUND',
  SOCKET_HANG_UP: 'ESOCKETTIMEDOUT',
  TLS_ERROR: 'DEPTH_ZERO_SELF_SIGNED_CERT',
};

export const AUTH_ERRORS = {
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource.',
  TOKEN_REFRESH_FAILED: 'Session refresh failed. Please log in again.',
  TOKEN_REFRESH_EXPIRED: 'Session has expired. Please log in again.',
  TOKEN_REFRESH_NOT_FOUND: 'No refresh token found. Please log in again.',
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
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  CANCELED_REQUEST: 'The request was canceled.',
  NOT_FOUND: 'Requested service not found.',
  INVALID_REQUEST: 'Invalid request. Please check the data or URL.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const getHttpErrorMessageByStatus = (statusCode) => {
  switch (statusCode) {
    case HTTP_STATUS.BAD_REQUEST:
      return COMMON_ERRORS.INVALID_REQUEST;
    case HTTP_STATUS.UNAUTHORIZED:
      return AUTH_ERRORS.INVALID_CREDENTIALS;
    case HTTP_STATUS.FORBIDDEN:
      return AUTH_ERRORS.UNAUTHORIZED_ACCESS;
    case HTTP_STATUS.NOT_FOUND:
      return COMMON_ERRORS.NOT_FOUND;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return COMMON_ERRORS.SERVER_ERROR;
    default:
      return COMMON_ERRORS.UNKNOWN_ERROR;
  }
};

export const getHttpErrorMessageByCode = (errorCode) => {
  switch (errorCode) {
    case AXIOS_ERROR_CODES.NETWORK:
    case AXIOS_ERROR_CODES.CONNECTION_REFUSED:
    case AXIOS_ERROR_CODES.CONNECTION_RESET:
    case AXIOS_ERROR_CODES.NOT_FOUND:
    case AXIOS_ERROR_CODES.TLS_ERROR:
      return COMMON_ERRORS.NETWORK_ERROR;

    case AXIOS_ERROR_CODES.TIMEOUT:
    case AXIOS_ERROR_CODES.SOCKET_HANG_UP:
      return COMMON_ERRORS.TIMEOUT_ERROR;

    case AXIOS_ERROR_CODES.CANCELED:
      return COMMON_ERRORS.CANCELED_REQUEST;

    case AXIOS_ERROR_CODES.BAD_REQUEST:
      return COMMON_ERRORS.INVALID_REQUEST;

    case AXIOS_ERROR_CODES.BAD_RESPONSE:
      return COMMON_ERRORS.SERVER_ERROR;

    default:
      return COMMON_ERRORS.UNKNOWN_ERROR;
  }
};

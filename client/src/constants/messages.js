// HTTP Status Codes
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  INSUFFICIENT_STORAGE: 507,
};

// ===========================================
// CONTEXT-SPECIFIC MESSAGE OBJECTS
// ===========================================

// Network & Server Messages
export const NETWORK_ERRORS = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  CONNECTION_LOST: 'Connection lost. Please check your internet connection.',
  REQUEST_FAILED: 'Request failed. Please try again.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  MAINTENANCE_MODE: 'Service is under maintenance. Please try again later.',
};

// Authentication Messages
export const AUTH_ERRORS = {
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  REFRESH_FAILED: 'Unable to refresh session. Please log in again.',
  REGISTER_FAILED: 'Registration failed. Please check your information.',
  LOGOUT_FAILED: 'Logout failed. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  ACCOUNT_NOT_FOUND: 'Account not found. Please check your credentials.',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this resource.',
  TOKEN_REFRESH_FAILED: 'Unable to refresh session. Please log in again.',
  ACCOUNT_LOCKED: 'Account has been locked. Please contact support.',
  ACCOUNT_SUSPENDED: 'Account has been suspended. Please contact support.',
};

export const AUTH_SUCCESS = {
  LOGIN: 'Login successful! Welcome back.',
  LOGOUT: 'You have been logged out.',
  REGISTER: 'Registration successful! Welcome aboard.',
  PASSWORD_RESET: 'Password reset successfully.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  ACCOUNT_ACTIVATED: 'Account activated successfully.',
  PASSWORD_UPDATED: 'Password changed successfully.',
  TOKEN_REFRESHED: 'Session refreshed successfully.',
  SESSION_RESTORED: 'Session restored successfully.',
};

// Form Validation Messages
export const FORM_ERRORS = {
  REQUIRED_FIELD: 'This field is required.',
  REQUIRED_FIELDS: 'Please fill in all required fields.',
  INVALID_FORMAT: 'Invalid format. Please check your input.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_URL: 'Please enter a valid URL.',
  INVALID_DATE: 'Please enter a valid date.',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long.',
  USERNAME_TOO_LONG: 'Username must be less than 50 characters.',
  USERNAME_TAKEN: 'Username is already taken.',
  INVALID_CHARACTERS: 'Contains invalid characters.',
  MIN_LENGTH: 'Must be at least {min} characters long.',
  MAX_LENGTH: 'Must be less than {max} characters.',
  INVALID_NUMBER: 'Please enter a valid number.',
  NUMBER_TOO_SMALL: 'Number must be at least {min}.',
  NUMBER_TOO_LARGE: 'Number must be less than {max}.',
};

export const FORM_SUCCESS = {
  FORM_SUBMITTED: 'Form submitted successfully.',
  VALIDATION_PASSED: 'All fields are valid.',
  DATA_SAVED: 'Data saved successfully.',
};

// General Operation Messages
export const COMMON_ERRORS = {
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
};

export const COMMON_SUCCESS = {
  OPERATION_COMPLETED: 'Operation completed successfully.',
  CHANGES_APPLIED: 'Changes applied successfully.',
  ACTION_COMPLETED: 'Action completed successfully.',
};

// ===========================================
// STATUS-BASED ERROR MAPPING
// ===========================================

export const STATUS_ERROR_MAP = {
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid format. Please check your input.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Invalid username or password.',
  [HTTP_STATUS.FORBIDDEN]: 'You are not authorized to access this resource.',
  [HTTP_STATUS.NOT_FOUND]: 'Resource not found.',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Method not allowed.',
  [HTTP_STATUS.REQUEST_TIMEOUT]: 'Request timeout. Please try again.',
  [HTTP_STATUS.CONFLICT]: 'Resource already exists.',
  [HTTP_STATUS.PAYLOAD_TOO_LARGE]: 'File is too large.',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Please fill in all required fields.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [HTTP_STATUS.NOT_IMPLEMENTED]: 'Feature not implemented.',
  [HTTP_STATUS.BAD_GATEWAY]: 'Server error occurred. Please try again later.',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Request timeout. Please try again.',
};

// ===========================================
// MESSAGE TYPE
// ===========================================

export const ERROR_TYPE = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN',
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get error message based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @param {string} fallback - Fallback message if status not mapped
 * @returns {string} Error message
 */
export const getErrorByStatus = (
  statusCode,
  fallback = 'An unexpected error occurred. Please try again.'
) => {
  return STATUS_ERROR_MAP[statusCode] || fallback;
};

/**
 * Format message with dynamic values
 * @param {string} message - Message template with {key} placeholders
 * @param {object} values - Object with replacement values
 * @returns {string} Formatted message
 */
export const formatMessage = (message, values = {}) => {
  return message.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
};

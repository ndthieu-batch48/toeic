import {
  AXIOS_ERROR_CODES,
  COMMON_ERRORS,
  getHttpErrorMessageByCode,
  getHttpErrorMessageByStatus,
} from '../constants/messages';

export const formatAxiosError = (error) => {
  // 👉 Case 1: Network Error (no response object from server)
  if (!error.response) {
    if (error.code === AXIOS_ERROR_CODES.NETWORK) {
      return {
        message: getHttpErrorMessageByCode(error.code),
        code: error.code,
      };
    }

    return {
      message: COMMON_ERRORS.UNKNOWN_ERROR,
      code: error.code || 'UNKNOWN_ERROR',
    };
  }

  // 👉 Case 2: HTTP Error (with response)
  const status = error.response.status || error.status;
  const details = error.response.data.detail;
  return {
    message: details || getHttpErrorMessageByStatus(status),
    status: status,
  };
};

export class AppError extends Error {
  constructor(context, error) {
    const fallbackMessage = error?.message || COMMON_ERRORS.UNKNOWN_ERROR;
    super(fallbackMessage);

    this.context = context;
    this.name = error?.name || 'AppError';
    this.message = fallbackMessage;
    this.status = error?.status || '404';
    this.stack = error?.stack || new Error().stack;
    this.raw = error;
  }
}

export function extractAxiosError(error) {
  if (error.response) {
    const { data, status } = error.response;

    // Validation error (422) - format
    if (status === 422 && Array.isArray(data.detail)) {
      return data.detail
        .map((err) => {
          const path = Array.isArray(err.loc) ? err.loc.slice(1).join('.') : err.loc;
          const field = path.charAt(0).toUpperCase() + path.slice(1);
          const msg = err.msg;
          const input = err.input !== undefined ? ` (Input: ${JSON.stringify(err.input)})` : '';
          const type = err.type ? ` [${err.type}]` : '';

          return `${msg}: ${field}${input}${type}`;
        })
        .join('\n');
    }

    // If error is a object (tự custom lỗi dạng JSON)
    if (typeof data.detail === 'object') {
      return data.detail.msg || JSON.stringify(data.detail);
    }

    // 📄 Nếu detail là string
    return data.detail || `Error ${status}`;
  } else if (error.request) {
    // Network error
    return 'Network error or no response from server.';
  } else {
    // Unknown error
    return error.message || 'Unknown error';
  }
}

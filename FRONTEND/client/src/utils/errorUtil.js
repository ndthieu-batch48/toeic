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

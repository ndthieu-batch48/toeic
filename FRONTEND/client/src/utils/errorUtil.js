import { COMMON_ERRORS } from '../constants/messages';

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

    // Validation error (422)
    if (status === 422 && Array.isArray(data.detail)) {
      return data.detail
        .map((err) => {
          const pathArr = Array.isArray(err.loc) ? err.loc.slice(1) : [];
          const field = pathArr.join('.') || 'Unknown field';
          const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
          const type = err.type ? `[${err.type}]` : '';
          const msg = formatValidationMessage(err, capitalizedField);
          return `${type} ${msg}`;
        })
        .join('\n');
    }

    // Custom object-based error
    if (typeof data.detail === 'object' && data.detail !== null) {
      return data.detail.message || JSON.stringify(data.detail);
    }

    // Detail is a plain string
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    return `Unexpected error format (status ${status})`;
  } else if (error.request) {
    return 'Network error or no response from server.';
  } else {
    return error.message || 'Unknown error';
  }
}

function formatValidationMessage(err, field) {
  switch (err.type) {
    case 'missing': {
      const inputKeys =
        err.input && typeof err.input === 'object' ? Object.keys(err.input).join(', ') : '';
      const inputPart = inputKeys ? `Input contained: "${inputKeys}"` : '';
      return `Missing field: ${field}.${inputPart ? ' ' + inputPart : ''}`;
    }

    case 'json_invalid': {
      const jsonErr = err?.ctx?.error || 'Invalid JSON format';
      return `Invalid JSON at ${field}: ${jsonErr}`;
    }

    default: {
      const inputStr = err.input !== undefined ? JSON.stringify(err.input) : '';
      const truncatedInput = inputStr.length > 50 ? inputStr.slice(0, 50) + '...' : inputStr;
      const inputPart = truncatedInput ? ` Input: ${truncatedInput}` : '';
      return `${err.msg}: ${field}${inputPart}`;
    }
  }
}

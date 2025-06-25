export class HttpCustomError extends Error {
  constructor(context, error) {
    const fallbackMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'An unknown HTTP error occurred';

    super(fallbackMessage);

    this.context = context;
    this.name = 'HttpError';
    this.stack = error?.stack || new Error().stack;
    this.code = error?.code;
    this.message = fallbackMessage;

    if (error?.response) {
      this.status = error.response.status;
      this.statusText = error.response.statusText;
      this.response = error.response.data?.detail || error.response.data || null;
    }

    if (error?.config) {
      this.url = error.config.url;
      this.method = error.config.method;
      this.data = error.config.data;
    }

    this.raw = error;
  }

  getDisplayMessage() {
    return this.message || 'Unexpected HTTP error';
  }
}
export class UnexpectedCustomError extends Error {
  constructor(context, error) {
    const fallbackMessage = error?.message || 'An unknown error occurred';
    super(fallbackMessage);

    this.context = context;
    this.name = error?.name || 'UnexpectedError';
    this.stack = error?.stack || new Error().stack;
    this.raw = error;
    this.message = fallbackMessage;
  }

  getDisplayMessage() {
    return this.message || 'Something went wrong';
  }
}

export class HttpCustomError extends Error {
  constructor(context, error) {
    super(error?.message || 'HTTP Custom Error');

    this.context = context;
    this.name = 'HttpError';
    this.stack = error?.stack || new Error().stack;
    this.code = error?.code;
    this.status = error?.response.status;
    this.statusText = error?.response.statusText;
    this.message = error?.message;
    this.url = error?.config.url;
    this.method = error?.config.method;
    this.data = error?.config.data;
    this.response = error?.response.data.detail;
    this.raw = error; // Optional: keep raw Axios error for inspection
  }
}

export class UnexpectedCustomError extends Error {
  constructor(context, error) {
    super(error?.message || 'An unknown error occurred');
    this.context = context;
    this.name = error?.name || 'UnexpectedError';
    this.stack = error?.stack || new Error().stack;
    this.raw = error;
  }
}

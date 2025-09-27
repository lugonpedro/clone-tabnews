export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Unexpected internal server error", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Contact the support";
    this.status_code = 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

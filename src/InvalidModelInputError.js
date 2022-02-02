export default class InvalidModelInputError extends Error {
  constructor(fields) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);
    this.message = `Required fields missing: ${fields.join(", ")}`;
  }
}

module.exports = class InvalidTokenException extends Error {
  constructor() {
    super();
    this.message = 'account_activation_failure';
    this.status = 400;
  }
};

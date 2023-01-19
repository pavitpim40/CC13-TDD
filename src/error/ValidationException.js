module.exports = function ValidationException(error) {
  this.status = 400;
  this.errors = error;
  this.message = 'validation_failure';
};

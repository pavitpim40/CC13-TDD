/* eslint-disable no-unused-vars */
module.exports = (err, req, res, next) => {
  const { status, message, errors } = err;
  let validationErrors;
  if (errors) {
    validationErrors = {};
    errors.array().forEach((error) => {
      validationErrors[error.param] = req.t(error.msg);
    });
    // return res.status(400).send({ validationErrors });
  }

  res.status(status).send({ path: req.originalUrl, timestamp: Date.now(), message: req.t(message), validationErrors });
};

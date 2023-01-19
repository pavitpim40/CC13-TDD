const { validationResult } = require('express-validator');
const ValidationException = require('../errors/ValidationException');
const UserService = require('../services/UserServices');

exports.register = async (req, res, next) => {
  // if (Object.keys(req.validationErrors).length > 0) {
  //   return res.status(400).send({ validationErrors: req.validationErrors });
  // }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // const validationErrors = {};
    // errors.array().forEach((error) => {
    //   validationErrors[error.param] = req.t(error.msg);
    // });
    // return res.status(400).send({ validationErrors });
    return next(new ValidationException(errors));
  }
  try {
    await UserService.createAccount(req.body);
    return res.status(200).send({ message: req.t('user_create_success') });
  } catch (error) {
    // return res.status(502).send({ message: req.t(error.message) });
    next(error);
    // return res.status(500);
  }
};

exports.activateAccount = async (req, res, next) => {
  const { activationToken } = req.params;
  try {
    await UserService.activateAccount(activationToken);
    res.send({ message: req.t('account_activation_success') });
    res.send();
  } catch (error) {
    // res.status(400).send({ message: req.t(error.message) });
    next(error);
  }
};

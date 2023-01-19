const { validationResult } = require('express-validator');
const ValidationException = require('../errors/ValidationException');
const UserService = require('../services/UserServices');

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationException(errors));
  }
  try {
    await UserService.createAccount(req.body);
    return res.status(200).send({ message: req.t('user_create_success') });
  } catch (error) {
    next(error);
  }
};

exports.activateAccount = async (req, res, next) => {
  const { activationToken } = req.params;
  try {
    await UserService.activateAccount(activationToken);
    res.send({ message: req.t('account_activation_success') });
    res.send();
  } catch (error) {
    next(error);
  }
};

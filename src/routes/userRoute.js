const express = require('express');
const { check, validationResult } = require('express-validator');
// const User = require('./User');
const UserService = require('../services/UserServices');
const router = express.Router();
const ValidationException = require('../errors/ValidationException');

router.post(
  '/',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_inuse');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_invalid'),
  async (req, res, next) => {
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
      await UserService.save(req.body);
      return res.status(200).send({ message: req.t('user_create_success') });
    } catch (error) {
      // return res.status(502).send({ message: req.t(error.message) });
      next(error);
      // return res.status(500);
    }
  }
);

router.post('/token/:activationToken', async (req, res, next) => {
  const { activationToken } = req.params;
  try {
    await UserService.activate(activationToken);
    res.send({ message: req.t('account_activation_success') });
    res.send();
  } catch (error) {
    // res.status(400).send({ message: req.t(error.message) });
    next(error);
  }
});

module.exports = router;

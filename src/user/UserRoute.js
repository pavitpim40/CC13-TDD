const express = require('express');
const { check, validationResult } = require('express-validator');
// const User = require('./User');
const UserService = require('./UserServices');
const router = express.Router();

// const validateUsername = (req, res, next) => {
//   // console.log(username, password, email);
//   const user = req.body;
//   req.validationErrors = {};
//   if (user.username === null) {
//     req.validationErrors.username = 'Username cannot be null';
//   }
//   next();
// };

// const validateEmail = (req, res, next) => {
//   const user = req.body;
//   if (user.email === null) {
//     req.validationErrors.email = 'Email cannot be null';
//   }

//   next();
// };
router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 character'),
  check('email')
    .notEmpty()
    .withMessage('Email cannot be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('E-mail in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 character')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must have at least 1 uppercase, 1 lowercase letter and 1 number'),
  async (req, res) => {
    // if (Object.keys(req.validationErrors).length > 0) {
    //   return res.status(400).send({ validationErrors: req.validationErrors });
    // }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => {
        validationErrors[error.param] = error.msg;
      });
      return res.status(400).send({ validationErrors });
    }
    try {
      await UserService.save(req.body);
      return res.status(200).send({ message: 'User Created' });
    } catch (error) {
      return res.status(400).send({ validationErrors: { email: 'E-mail in use' } });
      // return res.status(500);
    }
  }
);

module.exports = router;

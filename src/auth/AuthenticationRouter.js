const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const UserService = require('../user/UserServices');
const AuthenticationException = require('./AuthenticationException');
const ForbiddenException = require('./ForbiddenException');
const { check, validationResult } = require('express-validator');
const TokenService = require('./TokenService');

router.post('/', check('email').isEmail(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AuthenticationException());
  }
  const { email, password } = req.body;
  const user = await UserService.findByEmail(email);
  if (!user) {
    // return res.status(401).send();
    return next(new AuthenticationException());
  }
  if (user.inactive) {
    return next(new ForbiddenException());
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return next(new AuthenticationException());
  }

  const token = TokenService.createToken(user);
  res.send({ id: user.id, username: user.username, token });
});

module.exports = router;

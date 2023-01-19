const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const UserService = require('../services/UserServices');
const TokenService = require('../services/TokenService');
const AuthenticationException = require('../errors/authError/AuthenticationException');
const ForbiddenException = require('../errors/authError/ForbiddenException');

exports.login = async (req, res, next) => {
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
};

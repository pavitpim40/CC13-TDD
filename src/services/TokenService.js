const jwt = require('jsonwebtoken');

const createToken = (user) => {
  const secretKey = process.env.JWT_SECRET || 'mySecret';
  return jwt.sign({ id: user.id }, secretKey);
};

module.exports = { createToken };

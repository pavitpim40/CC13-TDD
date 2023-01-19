const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign({ id: user.id }, 'mySecret');
};

module.exports = { createToken };

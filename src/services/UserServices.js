const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Repo
const sequelize = require('../connection/database');
const User = require('../model/User');

// Exception
const EmailException = require('../errors/emailError/EmailException');
const InvalidTokenException = require('../errors/tokenError/InvalidTokenException');

// Other Service
const EmailService = require('./EmailService');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};
const createAccount = async (body) => {
  const { username, password, email } = body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { username, password: hashedPassword, email, activationToken: generateToken(16) };
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });

  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw new EmailException();
  }
};
const findByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

const activateAccount = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  if (!user) {
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};
module.exports = { createAccount, findByEmail, activateAccount };

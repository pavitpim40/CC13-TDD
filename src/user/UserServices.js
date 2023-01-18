const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('./User');
const EmailService = require('../email/EmailService');
const EmailException = require('../email/EmailException');
const sequelize = require('../config/database');

const generateToken = (length) => {
  // console.log(crypto.randomBytes(length).toString('hex'));
  // console.log(crypto.randomBytes(length).toString('hex').substring(0, length));
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};
const save = async (body) => {
  const { username, password, email } = body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { username, password: hashedPassword, email, activationToken: generateToken(16) };
  const transaction = await sequelize.transaction();
  await User.create(user, { transaction });
  console.log('$$', user.activationToken);

  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    console.log('AFTER SEND MAIL');
    await transaction.commit();
  } catch (error) {
    console.log('error-send email', error);
    await transaction.rollback();
    throw new EmailException();
  }
};
const findByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};
module.exports = { save, findByEmail };

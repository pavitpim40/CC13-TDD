const bcrypt = require('bcryptjs');
const User = require('./User');
const save = async (body) => {
  const { username, password, email } = body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashedPassword, email });
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};
module.exports = { save, findByEmail };

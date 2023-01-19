const nodemailer = require('nodemailer');
const config = require('../../config/config.json');
// const nodemailerStub = require('nodemailer-stub');
// const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

const mailConfig = config[process.env.NODE_ENV].mail;
const transporter = nodemailer.createTransport({
  ...mailConfig,
});

module.exports = transporter;

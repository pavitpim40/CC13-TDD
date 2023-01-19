const nodemailer = require('nodemailer');
const transporter = require('../connection/emailTransporter');

const sendAccountActivation = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>

    <b>Please click link below to activate your account </b>
    </div>
    <div>
      <h1> your token is ${token} </h1>
    </div> 
    `,
  });
  if (process.env.NODE_ENV === 'development') {
    console.log('url' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendAccountActivation };

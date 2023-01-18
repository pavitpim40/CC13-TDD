const nodemailer = require('nodemailer');
const transporter = require('../config/emailTransporter');

const sendAccountActivation = async (email, token) => {
  // transporter.verify(function (error) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Server is ready to take our messages');
  //   }
  // });
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
      <a href="http://localhost:8080/#/login?token=${token}">Activate</a>
    </div> 
    `,
  });
  if (process.env.NODE_ENV === 'development') {
    console.log('url' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendAccountActivation };

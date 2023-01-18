const transporter = require('../config/emailTransporter');

const sendAccountActivation = async (email, token) => {
  // transporter.verify(function (error) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Server is ready to take our messages');
  //   }
  // });
  return await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `Token is ${token}`,
  });
};

module.exports = { sendAccountActivation };

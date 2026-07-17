const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailEnabled = Boolean(emailUser && emailPass);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    })
  : null;

module.exports = { transporter, emailEnabled, emailUser };

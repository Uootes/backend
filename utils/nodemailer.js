require('dotenv').config();
const nodemailer = require('nodemailer');

// Create the transporter once
const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: 465,
  service: process.env.SERVICE,
  secure: true,
  auth: {
    user: process.env.APP_USERNAME,
    pass: process.env.APP_PASSWORD
  }
});

async function sendEmail(options) {
  const info = await transporter.sendMail({
    from: `"Uootes" <${process.env.APP_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  console.log('Message sent: %s', info.messageId);
}

module.exports = { sendEmail };

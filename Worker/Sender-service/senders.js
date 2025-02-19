const nodemailer = require('nodemailer');
const { google } = require('googleapis');


require('dotenv').config();

// Инструкция по этим переменным в README.md
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMails(consumers, sub, texts) {
  const data = Date.now()
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'notificationsystem858@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: '"Notification System" notificationsystem858@gmail.com',
      to: `${consumers}`,
      subject: `${sub}`,
      text: `${texts}`
    };

    await transporter.sendMail(mailOptions);

    return Date.now() - data
  } catch (error) {
    return error.message;
  }
}


module.exports = { sendMails }

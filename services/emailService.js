const nodemailer = require('nodemailer');
const { buildEmailTemplate } = require('./templateService');
const logger = require('../utils/logger');
require('dotenv').config();

const path = require("path");

const cidAttachments = [
  {
    filename: "yaka.png",
    path: path.join(__dirname, "../assets/yaka.png"),
    cid: "yakaLogo",
  },
  {
    filename: "iitil.png",
    path: path.join(__dirname, "../assets/iitil.png"),
    cid: "iitilLogo",
  },
  {
    filename: "instagram.png",
    path: path.join(__dirname, "../assets/instagram.png"),
    cid: "instagramIcon",
  },
  {
    filename: "x.png",
    path: path.join(__dirname, "../assets/x.png"),
    cid: "xIcon",
  },
  {
    filename: "facebook.png",
    path: path.join(__dirname, "../assets/facebook.png"),
    cid: "facebookIcon",
  },
  {
    filename: "linkedin.png",
    path: path.join(__dirname, "../assets/linkedin.png"),
    cid: "linkedinIcon",
  },
  {
    filename: "clock.png",
    path: path.join(__dirname, "../assets/clock.png"),
    cid: "clockIcon",
  },
  {
    filename: "calendar.png",
    path: path.join(__dirname, "../assets/calendar.png"),
    cid: "calendarIcon",
  },
  {
    filename: "email.png",
    path: path.join(__dirname, "../assets/email.png"),
    cid: "emailIcon",
  },
  {
    filename: "globe.png",
    path: path.join(__dirname, "../assets/globe.png"),
    cid: "globeIcon",
  },
  {
  filename: "header-pattern.png",
  path: path.join(__dirname, "../assets/header-pattern.png"),
  cid: "headerPattern",
},

  {
    filename: "profile.jpg",
    path: path.join(__dirname, "../assets/default-profile.jpg"),
    cid: "senderImage",
  },
];


let transporter = null;

/**
 * Create/reuse the Nodemailer transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
  try {
    const t = getTransporter();
    await t.verify();
    logger.info('SMTP connection verified successfully');
    return true;
  } catch (err) {
    logger.error('SMTP connection failed:', err.message);
    return false;
  }
}

/**
 * Send an email
 * @param {Object} params
 */
async function sendEmail({
  senderName,
  senderEmail,
  senderImage,
  recipients,      // array of "to" addresses
  cc,              // array (optional)
  bcc,             // array (optional)
  subject,
  emailContent,
  attachments,     // multer file objects
}) {
  const t = getTransporter();

  // Build HTML from template
  const html = buildEmailTemplate({ senderName, senderEmail, senderImage, subject, emailContent });

  // Map multer files to Nodemailer attachments
  const nodeAttachments = (attachments || []).map((file) => ({
    filename: file.originalname,
    path: file.path,
    contentType: file.mimetype,
  }));

  const mailOptions = {
    from: `"${senderName}" <${process.env.SMTP_USER}>`,  // Use SMTP user; Reply-To is the sender
    replyTo: `"${senderName}" <${senderEmail}>`,
    to: recipients.join(', '),
    cc: cc && cc.length ? cc.join(', ') : undefined,
    bcc: bcc && bcc.length ? bcc.join(', ') : undefined,
    subject,
    html,
    text: emailContent, 
    attachments: [...cidAttachments, ...nodeAttachments],
  };

  const info = await t.sendMail(mailOptions);

  logger.info(`Email sent: ${info.messageId} | To: ${recipients.join(', ')} | Subject: "${subject}"`);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

module.exports = { sendEmail, verifyConnection };

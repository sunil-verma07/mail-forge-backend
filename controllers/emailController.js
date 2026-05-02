const { sendEmail } = require('../services/emailService');
const { cleanupFiles } = require('../middleware/upload');
const logger = require('../utils/logger');

/**
 * POST /api/email/send
 */
async function sendEmailController(req, res) {
  const files = req.files || [];

  try {
    const {
      senderName,
      senderEmail,
      senderImage,
      recipients,
      cc,
      bcc,
      subject,
      emailContent,
    } = req.body;

    logger.info(`Send email request | From: ${senderEmail} | To: ${JSON.stringify(recipients)} | Subject: "${subject}"`);

    const result = await sendEmail({
      senderName,
      senderEmail,
      senderImage,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      cc: Array.isArray(cc) ? cc : (cc ? [cc] : []),
      bcc: Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []),
      subject,
      emailContent,
      attachments: files,
    });

    // Clean up temp files after successful send
    cleanupFiles(files);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        attachmentCount: files.length,
      },
    });

  } catch (err) {
    // Clean up files on error too
    cleanupFiles(files);
    logger.error('Email send failed:', err);

    const statusCode = err.responseCode
      ? (err.responseCode >= 500 ? 502 : 400)
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to send email',
      code: err.code || 'EMAIL_ERROR',
    });
  }
}

/**
 * GET /api/email/health
 */
async function healthCheck(req, res) {
  const { verifyConnection } = require('../services/emailService');
  const smtpOk = await verifyConnection();

  return res.status(smtpOk ? 200 : 503).json({
    success: smtpOk,
    status: smtpOk ? 'healthy' : 'degraded',
    smtp: smtpOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/email/preview
 * Returns the rendered HTML without sending
 */
async function previewEmail(req, res) {
  try {
    const { buildEmailTemplate } = require('../services/templateService');
    const { senderName, senderEmail, senderImage, subject, emailContent } = req.body;

    const html = buildEmailTemplate({ senderName, senderEmail, senderImage, subject, emailContent });

    return res.status(200).json({ success: true, html });
  } catch (err) {
    logger.error('Preview generation failed:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate preview' });
  }
}

module.exports = { sendEmailController, healthCheck, previewEmail };

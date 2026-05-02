const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { sendEmailValidators, handleValidationErrors } = require('../middleware/validators');
const { sendEmailController, healthCheck, previewEmail } = require('../controllers/emailController');

/**
 * @route   GET /api/email/health
 * @desc    SMTP health check
 */
router.get('/health', healthCheck);

/**
 * @route   POST /api/email/preview
 * @desc    Generate email HTML preview without sending
 */
router.post('/preview', previewEmail);

/**
 * @route   POST /api/email/send
 * @desc    Send an email with optional attachments
 */
router.post(
  '/send',
  upload.array('attachments', 10),
  sendEmailValidators,
  handleValidationErrors,
  sendEmailController
);

module.exports = router;

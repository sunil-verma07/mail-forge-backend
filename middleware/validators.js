const { body, validationResult } = require('express-validator');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse a field that can be either a JSON array or a comma-separated string
 */
function parseEmailList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return value.split(',').map((e) => e.trim()).filter(Boolean);
}

const sendEmailValidators = [
  body('senderName')
    .trim()
    .notEmpty().withMessage('Sender name is required')
    .isLength({ max: 100 }).withMessage('Sender name must be under 100 characters'),

  body('senderEmail')
    .trim()
    .notEmpty().withMessage('Sender email is required')
    .isEmail().withMessage('Sender email is invalid')
    .normalizeEmail(),

  body('senderImage')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Sender image must be a valid HTTP/HTTPS URL'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 255 }).withMessage('Subject must be under 255 characters'),

  body('emailContent')
    .trim()
    .notEmpty().withMessage('Email content is required')
    .isLength({ max: 50000 }).withMessage('Content too long (max 50,000 chars)'),

  body('recipients')
    .customSanitizer(parseEmailList)
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one recipient is required');
      }
      for (const email of value) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid recipient email: ${email}`);
        }
      }
      if (value.length > 50) throw new Error('Maximum 50 recipients allowed');
      return true;
    }),

  body('cc')
    .optional({ checkFalsy: true })
    .customSanitizer(parseEmailList)
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      for (const email of value) {
        if (!emailRegex.test(email)) throw new Error(`Invalid CC email: ${email}`);
      }
      return true;
    }),

  body('bcc')
    .optional({ checkFalsy: true })
    .customSanitizer(parseEmailList)
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      for (const email of value) {
        if (!emailRegex.test(email)) throw new Error(`Invalid BCC email: ${email}`);
      }
      return true;
    }),
];

/**
 * Middleware to check validation results
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { sendEmailValidators, handleValidationErrors };

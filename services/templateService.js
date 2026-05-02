const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const TEMPLATE_PATH = path.join(__dirname, '../templates/email.html');

/**
 * Load and populate the HTML email template
 */
function buildEmailTemplate({ senderName, senderEmail, senderImage, subject, emailContent }) {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Sanitize content to prevent XSS — allow safe HTML tags
  const safeContent = sanitizeHtml(emailContent, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li',
      'a', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'span', 'div'
    ],
    allowedAttributes: {
      'a': ['href', 'target'],
      'span': ['style'],
      'div': ['style'],
      'p': ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

  // Normalize newlines for plain text content
  const contentWithBreaks = safeContent.includes('<') 
    ? safeContent 
    : safeContent.replace(/\n/g, '<br>');

  const sentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Handle optional senderImage block
  const imgBlock = senderImage
    ? `<table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="${escapeAttr(senderImage)}" alt="${escapeAttr(senderName)}" width="72" height="72"
              style="border-radius: 50%; border: 3px solid rgba(255,255,255,0.2); object-fit: cover; display: block; margin: 0 auto;">
          </td>
        </tr>
      </table>`
    : '';

  // Replace all placeholders
  template = template
    .replace(/{{#if senderImage}}[\s\S]*?{{\/if}}/g, imgBlock)
    .replace(/{{senderName}}/g, escapeHtml(senderName))
    .replace(/{{senderEmail}}/g, escapeHtml(senderEmail))
    .replace(/{{senderImage}}/g, escapeAttr(senderImage || ''))
    .replace(/{{subject}}/g, escapeHtml(subject))
    .replace(/{{emailContent}}/g, contentWithBreaks)
    .replace(/{{sentDate}}/g, escapeHtml(sentDate));

  return template;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

module.exports = { buildEmailTemplate };

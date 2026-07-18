const { transporter, emailEnabled, emailUser } = require('../config/mailer');

function buildResetHtml(customerName, resetLink, expiresInMinutes) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#3d2b1f;">
    <div style="text-align:center;padding:20px 0;">
      <h1 style="margin:0;font-size:22px;color:#a9744f;">Crosia by Hand</h1>
      <p style="margin:4px 0 0;font-size:12px;letter-spacing:1px;color:#8a7a6a;">EVERY LOOP MADE WITH LOVE</p>
    </div>
    <div style="background:#fbf6ef;border:1px solid #eaddcd;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px;font-size:18px;">Hi ${customerName},</h2>
      <p style="margin:0 0 16px;color:#6b5b4b;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link is valid for ${expiresInMinutes} minutes.
      </p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetLink}"
           style="display:inline-block;background:#a9744f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;">
          Reset your password
        </a>
      </p>
      <p style="margin:0 0 8px;color:#6b5b4b;font-size:13px;">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <p style="margin:0;word-break:break-all;font-size:13px;color:#a9744f;">${resetLink}</p>
      <p style="margin:16px 0 0;color:#8a7a6a;font-size:13px;">
        If you did not request this, you can safely ignore this email — your password will not change.
      </p>
    </div>
    <p style="text-align:center;color:#8a7a6a;font-size:12px;margin:20px 0;">
      This is an automated message from Crosia by Hand.
    </p>
  </div>`;
}

// Sends the reset link to the registered email. Returns true if sent, false otherwise.
async function sendPasswordReset(toEmail, customerName, resetLink, expiresInMinutes) {
  if (!emailEnabled) return false;
  try {
    await transporter.sendMail({
      from: `"Crosia by Hand" <${emailUser}>`,
      to: toEmail,
      subject: 'Reset your Crosia by Hand password',
      html: buildResetHtml(customerName || 'there', resetLink, expiresInMinutes),
    });
    console.log(`Password reset email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('Password reset email failed:', err.message);
    return false;
  }
}

module.exports = { sendPasswordReset };

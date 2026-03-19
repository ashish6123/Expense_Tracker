const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM || '"Expense Tracker Pro" <noreply@expensetracker.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function otpEmailTemplate(otp, type, name) {
  const isReset = type === 'forgot_password';
  const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const message = isReset
    ? 'You requested a password reset. Use the OTP below to reset your password.'
    : 'Welcome! Use the OTP below to verify your email address.';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fe;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fe;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,0.10);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">💰</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Expense Tracker Pro</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1e1b4b;margin:0 0 12px;font-size:20px;">${title}</h2>
            <p style="color:#6b7280;margin:0 0 32px;line-height:1.6;">Hi ${name}, ${message}</p>
            <!-- OTP Box -->
            <div style="background:#f4f7fe;border:2px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
              <p style="color:#6b7280;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
              <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4f46e5;font-family:monospace;">${otp}</div>
              <p style="color:#9ca3af;margin:12px 0 0;font-size:13px;">⏱ Expires in ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes</p>
            </div>
            <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">If you didn't request this, you can safely ignore this email. Never share your OTP with anyone.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Expense Tracker Pro. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOTPEmail(email, otp, type, name = 'User') {
  const isReset = type === 'forgot_password';
  const subject = isReset ? '🔐 Password Reset OTP - Expense Tracker Pro' : '✅ Verify Your Email - Expense Tracker Pro';

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject,
    html: otpEmailTemplate(otp, type, name),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email} [${info.messageId}]`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw new Error('Failed to send email. Please try again.');
  }
}

// Verify SMTP config at startup (non-blocking)
transporter.verify().then(() => {
  console.log('✅ SMTP server ready');
}).catch(err => {
  console.warn('⚠️  SMTP not configured properly (emails will fail):', err.message);
});

module.exports = { sendOTPEmail };

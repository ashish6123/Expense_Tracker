const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars, no spaces)
  },
});

async function sendOTPEmail(email, otp, type, name = 'User') {
  const isReset = type === 'forgot_password';
  const subject = isReset
    ? '🔐 Password Reset OTP - Expense Tracker'
    : '✅ Verify Your Email - Expense Tracker';
  const title   = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const message = isReset
    ? 'You requested a password reset. Use the OTP below to reset your password.'
    : 'Welcome to Expense Tracker Pro! Use the OTP below to verify your email address.';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#141420;border:1px solid #ffffff12;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#eeeeff">${title}</h2>
      <p style="color:#8888aa;margin:0 0 24px">Hi ${name},</p>
      <p style="color:#8888aa;margin:0 0 20px">${message}</p>
      <div style="text-align:center;padding:24px;background:#18182a;border-radius:10px;margin:0 0 20px">
        <span style="font-size:2.4rem;font-weight:800;letter-spacing:14px;color:#6366f1">${otp}</span>
      </div>
      <p style="color:#8888aa;font-size:0.85rem;margin:0 0 8px">
        This code expires in <strong>${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes</strong>.
      </p>
      <p style="color:#44445a;font-size:0.8rem;margin:0">
        If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #ffffff12;margin:24px 0">
      <p style="color:#44445a;font-size:0.75rem;margin:0;text-align:center">Expense Tracker Pro</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Expense Tracker Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log('📤 OTP email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error('Failed to send email');
  }
}

module.exports = sendOTPEmail;

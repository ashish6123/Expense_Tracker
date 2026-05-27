const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#14142080;border:1px solid #ffffff12;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#eeeeff">${title}</h2>
      <p style="color:#8888aa;margin:0 0 24px">Hi ${name},</p>
      <p style="color:#8888aa;margin:0 0 20px">${message}</p>
      <div style="text-align:center;padding:20px;background:#18182a;border-radius:10px;margin:0 0 20px">
        <span style="font-size:2.2rem;font-weight:800;letter-spacing:12px;color:#6366f1">${otp}</span>
      </div>
      <p style="color:#8888aa;font-size:0.85rem;margin:0 0 8px">
        This code expires in ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes.
      </p>
      <p style="color:#44445a;font-size:0.8rem;margin:0">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>`;

  try {
    await sgMail.send({
      to: email,
      from: `Expense Tracker <${process.env.SENDGRID_VERIFIED_SENDER}>`,
      subject,
      html,
    });
    console.log('📤 OTP email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    throw new Error('Failed to send email');
  }
}

module.exports = sendOTPEmail;

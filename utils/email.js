const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = 'onboarding@resend.dev'; // safe default

function otpEmailTemplate(otp, type, name) {
  const isReset = type === 'forgot_password';
  const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const message = isReset
    ? 'You requested a password reset. Use the OTP below to reset your password.'
    : 'Welcome! Use the OTP below to verify your email address.';

  return `
    <h2>${title}</h2>
    <p>Hi ${name}, ${message}</p>
    <h1>${otp}</h1>
    <p>Expires in ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes</p>
  `;
}

async function sendOTPEmail(email, otp, type, name = 'User') {
  const isReset = type === 'forgot_password';

  const subject = isReset
    ? '🔐 Password Reset OTP'
    : '✅ Verify Your Email';

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html: otpEmailTemplate(otp, type, name),
    });

    console.log("✅ Email sent:", response);
    return { success: true };
  } catch (error) {
    console.error("❌ Email error:", error);
    throw new Error('Failed to send email');
  }
}

module.exports = sendOTPEmail;

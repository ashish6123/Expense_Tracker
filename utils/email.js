const sgMail = require('@sendgrid/mail');

// Set API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Generate OTP Email HTML Template
 */
function otpEmailTemplate(otp, type, name) {
  const isReset = type === 'forgot_password';

  const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
  const message = isReset
    ? 'You requested a password reset. Use the OTP below to reset your password.'
    : 'Welcome! Use the OTP below to verify your email address.';

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${title}</h2>
      <p>Hi ${name},</p>
      <p>${message}</p>

      <div style="margin: 20px 0; padding: 15px; background: #f4f4f4; text-align: center;">
        <h1 style="letter-spacing: 5px;">${otp}</h1>
      </div>

      <p>This OTP will expire in ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes.</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>

      <br>
      <p>— Expense Tracker Pro</p>
    </div>
  `;
}

/**
 * Send OTP Email
 */
async function sendOTPEmail(email, otp, type, name = 'User') {
  const isReset = type === 'forgot_password';

  const subject = isReset
    ? '🔐 Password Reset OTP - Expense Tracker'
    : '✅ Verify Your Email - Expense Tracker';

  const msg = {
    to: email,
    from: `Expense Tracker <${process.env.SENDGRID_VERIFIED_SENDER}>`, // MUST be verified in SendGrid
    subject,
    html: `
  <p>Your OTP is:</p>
  <h1>${otp}</h1>
  `,
  };

  try {
    console.log("📤 Sending email to:", email);

    const response = await sgMail.send(msg);

    console.log("FROM:", process.env.SENDGRID_VERIFIED_SENDER);

    console.log("🔥 SendGrid Response:", response[0]?.statusCode);

    return { success: true };
  } catch (error) {
    console.error("❌ SendGrid Error:", error.response?.body || error);
    throw new Error('Failed to send email');
  }
}

module.exports = sendOTPEmail;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { sendOTPEmail } = require('../utils/email');
const authMiddleware = require('../middleware/auth');

const OTP_EXPIRES = parseInt(process.env.OTP_EXPIRES_IN_MINUTES || 10);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#ef4444', icon: '🍔' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#8b5cf6', icon: '🛍️' },
  { name: 'Entertainment', color: '#f59e0b', icon: '🎬' },
  { name: 'Bills & Utilities', color: '#6b7280', icon: '⚡' },
  { name: 'Healthcare', color: '#10b981', icon: '🏥' },
  { name: 'Education', color: '#06b6d4', icon: '📚' },
  { name: 'Travel', color: '#f97316', icon: '✈️' },
  { name: 'Other', color: '#9ca3af', icon: '💼' },
];

// ─── REGISTER ───────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const avatarColors = ['#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626'];
    const avatar = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, avatar]
    );
    const userId = result.insertId;

    // Create default categories for this user
    const catValues = DEFAULT_CATEGORIES.map(c => [userId, c.name, c.color, c.icon, true]);
    await db.query('INSERT INTO categories (user_id, name, color, icon, is_default) VALUES ?', [catValues]);

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES * 60 * 1000);
    await db.query(
      'INSERT INTO otps (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email.toLowerCase().trim(), otp, 'verify_email', expiresAt]
    );

    await sendOTPEmail(email, otp, 'verify_email', name.trim());

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP to verify your account.',
      email: email.toLowerCase().trim(),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed. Please try again.' });
  }
});

// ─── VERIFY EMAIL OTP ────────────────────────────────────────────────────────
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const [rows] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND type = "verify_email" AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase().trim(), otp.trim()]
    );

    if (rows.length === 0)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });

    const otpRecord = rows[0];
    await db.query('UPDATE otps SET used = TRUE WHERE id = ?', [otpRecord.id]);
    await db.query('UPDATE users SET is_verified = TRUE WHERE email = ?', [email.toLowerCase().trim()]);

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const user = users[0];
    const token = generateToken(user);

    res.cookie('token', token, cookieOptions);
    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Expense Tracker Pro.',
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

// ─── RESEND OTP ──────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const otpType = type === 'forgot_password' ? 'forgot_password' : 'verify_email';

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0)
      return res.status(404).json({ success: false, message: 'Email not found.' });

    const user = users[0];

    // Rate limit: max 3 OTPs in 15 min
    const [recentOtps] = await db.query(
      'SELECT COUNT(*) as count FROM otps WHERE email = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)',
      [email.toLowerCase().trim(), otpType]
    );
    if (recentOtps[0].count >= 3)
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please wait 15 minutes.' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES * 60 * 1000);
    await db.query(
      'INSERT INTO otps (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, email.toLowerCase().trim(), otp, otpType, expiresAt]
    );

    await sendOTPEmail(email, otp, otpType, user.name);

    res.json({ success: true, message: 'OTP sent successfully. Check your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to resend OTP.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.is_verified)
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    // Always return success to prevent email enumeration
    if (users.length === 0)
      return res.json({ success: true, message: 'If this email exists, a reset OTP has been sent.' });

    const user = users[0];

    // Rate limit
    const [recentOtps] = await db.query(
      'SELECT COUNT(*) as count FROM otps WHERE email = ? AND type = "forgot_password" AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)',
      [email.toLowerCase().trim()]
    );
    if (recentOtps[0].count >= 3)
      return res.status(429).json({ success: false, message: 'Too many reset attempts. Please wait 15 minutes.' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES * 60 * 1000);
    await db.query(
      'INSERT INTO otps (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, email.toLowerCase().trim(), otp, 'forgot_password', expiresAt]
    );

    await sendOTPEmail(email, otp, 'forgot_password', user.name);

    res.json({ success: true, message: 'If this email exists, a reset OTP has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to send reset email.' });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const [rows] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND type = "forgot_password" AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase().trim(), otp.trim()]
    );

    if (rows.length === 0)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    const otpRecord = rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query('UPDATE otps SET used = TRUE WHERE id = ?', [otpRecord.id]);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.toLowerCase().trim()]);

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, avatar, is_verified, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (name) await db.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);

    if (currentPassword && newPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      const hashed = await bcrypt.hash(newPassword, 12);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
});

module.exports = router;

const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter using environment variables.
 * Supports SendGrid (via SMTP) and any generic SMTP provider.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a verification email to a newly registered user.
 *
 * @param {object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.verificationToken - Raw (unhashed) verification token
 * @returns {Promise<void>}
 */
async function sendVerificationEmail({ toEmail, firstName, verificationToken }) {
  const transporter = createTransporter();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const fromAddress = process.env.EMAIL_FROM || 'noreply@italor.com';

  const mailOptions = {
    from: `"iTailor" <${fromAddress}>`,
    to: toEmail,
    subject: 'Verify your iTailor account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to iTailor, ${firstName}!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          Thank you for registering. Please verify your email address by clicking the button below.
          This link will expire in <strong>24 hours</strong>.
        </p>
        <a
          href="${verificationLink}"
          style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;"
        >
          Verify Email Address
        </a>
        <p style="color: #8a8a8a; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #8a8a8a; font-size: 12px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${verificationLink}" style="color: #4a90e2;">${verificationLink}</a>
        </p>
      </div>
    `,
    text: `Welcome to iTailor, ${firstName}!\n\nVerify your email address by visiting:\n${verificationLink}\n\nThis link expires in 24 hours.`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a password reset email to a user.
 *
 * @param {object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.resetToken - Raw (unhashed) password reset token
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail({ toEmail, firstName, resetToken }) {
  const transporter = createTransporter();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const fromAddress = process.env.EMAIL_FROM || 'noreply@italor.com';

  const mailOptions = {
    from: `"iTailor" <${fromAddress}>`,
    to: toEmail,
    subject: 'Reset your iTailor password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password, ${firstName}</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          We received a request to reset your iTailor account password.
          Click the button below to choose a new password.
          This link will expire in <strong>1 hour</strong>.
        </p>
        <a
          href="${resetLink}"
          style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 16px 0;"
        >
          Reset Password
        </a>
        <p style="color: #8a8a8a; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #8a8a8a; font-size: 12px;">
          If the button above doesn't work, copy and paste this link into your browser:<br />
          <a href="${resetLink}" style="color: #4a90e2;">${resetLink}</a>
        </p>
      </div>
    `,
    text: `Reset your iTailor password\n\nClick the link below to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

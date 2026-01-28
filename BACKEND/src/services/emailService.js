

const nodemailer = require('nodemailer');
const ApiError = require('../utils/ApiError');

class EmailService {
  constructor() {
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} name - User name
   */
  async sendOTP(email, otp, name = 'User') {
    try {
      const mailOptions = {
        from: `"SEO Backlink Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: this.getOTPEmailTemplate(name, otp)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      throw ApiError.internal('Failed to send OTP email');
    }
  }

  /**
   * OTP Email Template
   * @param {string} name - User name
   * @param {string} otp - OTP code
   * @returns {string} - HTML template
   */
  getOTPEmailTemplate(name, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            background-color: white;
            padding: 30px;
            margin-top: 20px;
          }
          .otp-box {
            background-color: #f0f0f0;
            border: 2px dashed #4CAF50;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your SEO Backlink Platform account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br>SEO Backlink Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email (optional)
   * @param {string} email - Recipient email
   * @param {string} name - User name
   */
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: `"SEO Backlink Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to SEO Backlink Platform',
        html: `
          <h2>Welcome ${name}!</h2>
          <p>Thank you for signing up for SEO Backlink Platform.</p>
          <p>You can now start creating SEO content and managing your backlinks.</p>
          <p>Best regards,<br>SEO Backlink Platform Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      // Don't throw error for welcome email
      return false;
    }
  }

  /**
   * Verify email service configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
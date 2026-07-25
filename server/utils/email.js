import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Local development / fallback transporter: log to console
  transporter = {
    sendMail: async (mailOptions) => {
      console.log("=========================================");
      console.log("MOCK EMAIL SENDER (No SMTP Configured)");
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log("HTML Content Preview:");
      console.log(mailOptions.html);
      console.log("=========================================");
      return { messageId: "mock-message-id-" + Date.now() };
    },
  };
}

export const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.FROM_EMAIL || "no-reply@shopsphere.com";
  const fromName = process.env.FROM_NAME || "ShopSphere";

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

export const getVerificationEmailTemplate = (name, url) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">ShopSphere</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Verify your email address</p>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; color: #374151;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5;">Thank you for registering at ShopSphere! To complete your sign-up and ensure your account's security, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" target="_blank" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">If the button above does not work, copy and paste this link in your browser URL field:<br/><a href="${url}" style="color: #4f46e5;">${url}</a></p>
      </div>
      <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #9ca3af;">
        <p>This is an automated email, please do not reply. Expiry: 24 hours.</p>
        <p>&copy; ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    </div>
  `;
};

export const getResetPasswordEmailTemplate = (name, url) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">ShopSphere</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Reset your password</p>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; color: #374151;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5;">We received a request to reset your ShopSphere account password. You can reset your password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" target="_blank" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.<br/>Copy and paste this link if button does not load:<br/><a href="${url}" style="color: #4f46e5;">${url}</a></p>
      </div>
      <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #9ca3af;">
        <p>This password reset link will expire in 1 hour.</p>
        <p>&copy; ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    </div>
  `;
};

export const sendStatusUpdateNotification = async (user, orderId, status, note = "") => {
  if (!user || !user.email) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">ShopSphere</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Order Status Update</p>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; color: #374151;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${user.name || "Customer"}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5;">Your order with ID <strong>${orderId}</strong> has been updated to:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="background-color: #e0e7ff; color: #4338ca; padding: 10px 20px; border-radius: 9999px; font-weight: bold; font-size: 16px; display: inline-block; border: 1px solid #c7d2fe;">
            ${status}
          </span>
        </div>
        ${note ? `<p style="font-size: 13px; color: #4b5563; background: #fff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-style: italic;">Note: ${note}</p>` : ""}
        <p style="font-size: 14px; line-height: 1.5; margin-top: 20px;">You can track your order status directly on our platform by visiting your order details page.</p>
      </div>
      <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #9ca3af;">
        <p>This is an automated notification. Please do not reply directly to this email.</p>
        <p>&copy; ${new Date().getFullYear()} ShopSphere. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `[ShopSphere] Order Update: ${status}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send status update notification email:", error.message);
  }
};

export default {
  sendEmail,
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
  sendStatusUpdateNotification,
};

import nodemailer from 'nodemailer';

// Create reusable transporter for Office 365 SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // false for STARTTLS (port 587)
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Office 365 SMTP
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

/**
 * Email template for new request notification to incharge
 */
export function newRequestEmailTemplate(data: {
  inchargeName: string;
  requesterName: string;
  requesterEmail: string;
  itemName: string;
  itemId: string;
  purpose: string;
  requestedDays: number;
  department: string;
  dashboardUrl: string;
}) {
  return {
    subject: `New Item Request: ${data.itemName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Equipment Request</h2>
          </div>
          <div class="content">
            <p>Dear ${data.inchargeName},</p>
            <p>A new request has been submitted for an item in your department.</p>
            
            <div class="detail">
              <span class="label">Requester:</span> ${data.requesterName} (${data.requesterEmail})
            </div>
            <div class="detail">
              <span class="label">Item:</span> ${data.itemName} (ID: ${data.itemId})
            </div>
            <div class="detail">
              <span class="label">Department:</span> ${data.department}
            </div>
            <div class="detail">
              <span class="label">Purpose:</span> ${data.purpose}
            </div>
            <div class="detail">
              <span class="label">Requested Duration:</span> ${data.requestedDays} days
            </div>
            
            <a href="${data.dashboardUrl}" class="button">Review Request</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Inventory Management System</p>
            <p>Robotics Lab, AI Research Centre, Woxsen University</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Email template for request approval/rejection
 */
export function requestStatusEmailTemplate(data: {
  userName: string;
  itemName: string;
  itemId: string;
  status: 'approved' | 'rejected';
  reason?: string;
  expectedReturnDate?: string;
  collectionInstructions?: string;
}) {
  const isApproved = data.status === 'approved';

  return {
    subject: `Request ${isApproved ? 'Approved' : 'Rejected'}: ${data.itemName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? '#28a745' : '#dc3545'}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Request ${isApproved ? 'Approved' : 'Rejected'}</h2>
          </div>
          <div class="content">
            <p>Dear ${data.userName},</p>
            <p>Your request for <strong>${data.itemName}</strong> (ID: ${data.itemId}) has been <strong>${data.status}</strong>.</p>
            
            ${isApproved ? `
              <div class="detail">
                <span class="label">Expected Return Date:</span> ${data.expectedReturnDate}
              </div>
              <div class="detail">
                <span class="label">Collection Instructions:</span> ${data.collectionInstructions || 'Please collect the item from the lab during working hours.'}
              </div>
            ` : `
              <div class="detail">
                <span class="label">Reason:</span> ${data.reason || 'Not specified'}
              </div>
            `}
          </div>
          <div class="footer">
            <p>This is an automated message from the Inventory Management System</p>
            <p>Robotics Lab, AI Research Centre, Woxsen University</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Email template for due date reminder
 */
export function dueDateReminderEmailTemplate(data: {
  userName: string;
  itemName: string;
  itemId: string;
  dueDate: string;
  daysRemaining: number;
}) {
  return {
    subject: `Reminder: Return ${data.itemName} by ${data.dueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Return Reminder</h2>
          </div>
          <div class="content">
            <p>Dear ${data.userName},</p>
            <p>This is a reminder that you have <strong>${data.daysRemaining} day(s)</strong> remaining to return:</p>
            
            <div class="warning">
              <strong>${data.itemName}</strong> (ID: ${data.itemId})<br>
              Due Date: <strong>${data.dueDate}</strong>
            </div>
            
            <p><strong>Important:</strong> Late returns will result in a 6-month ban from borrowing any items.</p>
            <p>Please return the item on time to avoid penalties.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Inventory Management System</p>
            <p>Robotics Lab, AI Research Centre, Woxsen University</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Email template for password reset
 */
export function passwordResetEmailTemplate(data: {
  userName: string;
  resetUrl: string;
}) {
  return {
    subject: 'Password Reset Request - Inventory System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Dear ${data.userName},</p>
            <p>We received a request to reset your password for the Inventory Management System.</p>
            
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${data.resetUrl}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul style="margin: 5px 0;">
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will not change until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the Inventory Management System</p>
            <p>Robotics Lab, AI Research Centre, Woxsen University</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, userName: string, resetUrl: string) {
  const template = passwordResetEmailTemplate({ userName, resetUrl });
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
}

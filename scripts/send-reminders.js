/**
 * Send Email Reminders Script
 * 
 * This script sends email reminders for issued items:
 * - 3 days before due date
 * - 1 day before due date  
 * - Overdue notifications
 * 
 * Schedule this script to run daily using:
 * - Linux/Mac: crontab -e, add: 0 9 * * * cd /path/to/project && node scripts/send-reminders.js
 * - Windows: Task Scheduler, run daily at 9 AM
 * 
 * Usage: node scripts/send-reminders.js
 */

const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to}:`, info.messageId);
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message);
        return false;
    }
}

function dueDateReminderEmail(userName, itemName, itemId, dueDate, daysRemaining) {
    return {
        subject: `Reminder: Return ${itemName} by ${dueDate}`,
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
            <p>Dear ${userName},</p>
            <p>This is a reminder that you have <strong>${daysRemaining} day(s)</strong> remaining to return:</p>
            
            <div class="warning">
              <strong>${itemName}</strong> (ID: ${itemId})<br>
              Due Date: <strong>${dueDate}</strong>
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

function overdueEmail(userName, itemName, itemId, dueDate, daysOverdue) {
    return {
        subject: `OVERDUE: ${itemName} - Action Required`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; color: #721c24; }
          .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ OVERDUE ITEM</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>The following item is <strong>${daysOverdue} day(s) overdue</strong>:</p>
            
            <div class="alert">
              <strong>${itemName}</strong> (ID: ${itemId})<br>
              Due Date: <strong>${dueDate}</strong><br>
              Days Overdue: <strong>${daysOverdue}</strong>
            </div>
            
            <p><strong style="color: #dc3545;">IMPORTANT WARNING:</strong></p>
            <p>You will receive a <strong>6-month ban</strong> from borrowing any items when this item is returned late.</p>
            <p>Please return the item immediately to the respective lab.</p>
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

async function sendReminders() {
    console.log('Starting reminder check...', new Date().toISOString());

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(now.getDate() + 1);
    oneDayFromNow.setHours(23, 59, 59, 999);

    try {
        // Get all active issue records (not yet returned)
        const activeRecords = await prisma.issueRecord.findMany({
            where: {
                actualReturnDate: null,
            },
            include: {
                user: true,
                item: true,
            },
        });

        console.log(`Found ${activeRecords.length} active issue records`);

        let sent3Day = 0;
        let sent1Day = 0;
        let sentOverdue = 0;

        for (const record of activeRecords) {
            const dueDate = new Date(record.expectedReturnDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            // 3-day reminder
            if (daysUntilDue === 3 && !record.reminder3DaysSent) {
                const emailData = dueDateReminderEmail(
                    record.user.name,
                    record.item.name,
                    record.item.manualId,
                    dueDate.toLocaleDateString(),
                    3
                );

                const success = await sendEmail(
                    record.user.email,
                    emailData.subject,
                    emailData.html
                );

                if (success) {
                    await prisma.issueRecord.update({
                        where: { id: record.id },
                        data: { reminder3DaysSent: true },
                    });
                    sent3Day++;
                }
            }

            // 1-day reminder
            if (daysUntilDue === 1 && !record.reminder1DaySent) {
                const emailData = dueDateReminderEmail(
                    record.user.name,
                    record.item.name,
                    record.item.manualId,
                    dueDate.toLocaleDateString(),
                    1
                );

                const success = await sendEmail(
                    record.user.email,
                    emailData.subject,
                    emailData.html
                );

                if (success) {
                    await prisma.issueRecord.update({
                        where: { id: record.id },
                        data: { reminder1DaySent: true },
                    });
                    sent1Day++;
                }
            }

            // Overdue notification
            if (daysUntilDue < 0 && !record.overdueSent) {
                const daysOverdue = Math.abs(daysUntilDue);
                const emailData = overdueEmail(
                    record.user.name,
                    record.item.name,
                    record.item.manualId,
                    dueDate.toLocaleDateString(),
                    daysOverdue
                );

                const success = await sendEmail(
                    record.user.email,
                    emailData.subject,
                    emailData.html
                );

                if (success) {
                    await prisma.issueRecord.update({
                        where: { id: record.id },
                        data: { overdueSent: true },
                    });
                    sentOverdue++;
                }
            }
        }

        console.log('Reminder summary:');
        console.log(`- 3-day reminders sent: ${sent3Day}`);
        console.log(`- 1-day reminders sent: ${sent1Day}`);
        console.log(`- Overdue notifications sent: ${sentOverdue}`);
        console.log('Reminder check complete!');
    } catch (error) {
        console.error('Error sending reminders:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
sendReminders();

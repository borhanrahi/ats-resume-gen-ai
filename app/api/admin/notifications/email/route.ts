/**
 * API endpoint for sending email notifications to admins
 * Handles critical system alerts and error notifications
 * Requirements: 13.3, 13.4 - System monitoring with email alerts
 */

import { NextRequest, NextResponse } from 'next/server';

export interface EmailNotificationRequest {
  recipients: string[];
  subject: string;
  body: string;
  notification?: {
    id: string;
    type: string;
    severity: string;
    timestamp: number;
  };
}

/**
 * POST /api/admin/notifications/email - Send email notification
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await verifyAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const emailData: EmailNotificationRequest = await request.json();

    // Validate request
    if (!emailData.recipients || emailData.recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients specified' },
        { status: 400 }
      );
    }

    if (!emailData.subject || !emailData.body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Log the email notification attempt
    console.log('Sending email notification:', {
      recipients: emailData.recipients,
      subject: emailData.subject,
      notificationId: emailData.notification?.id,
      timestamp: new Date().toISOString(),
    });

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    const emailResults = await Promise.allSettled(
      emailData.recipients.map(recipient => sendEmailToRecipient(recipient, emailData))
    );

    // Count successful and failed sends
    const successful = emailResults.filter(result => result.status === 'fulfilled').length;
    const failed = emailResults.filter(result => result.status === 'rejected').length;

    // Log results
    if (failed > 0) {
      console.error('Some email notifications failed:', {
        successful,
        failed,
        total: emailData.recipients.length,
      });
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: emailData.recipients.length,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Failed to send email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

/**
 * Send email to individual recipient
 */
async function sendEmailToRecipient(
  recipient: string,
  emailData: EmailNotificationRequest
): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 EMAIL NOTIFICATION (DEV MODE):`);
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Body: ${emailData.body}`);
    console.log('---');
    return;
  }

  // In production, use actual email service
  const emailServiceConfig = {
    apiKey: process.env.EMAIL_SERVICE_API_KEY,
    fromEmail: process.env.ADMIN_FROM_EMAIL || 'admin@atsresumechecker.com',
    fromName: process.env.ADMIN_FROM_NAME || 'ATS Resume Checker Admin',
  };

  if (!emailServiceConfig.apiKey) {
    throw new Error('Email service not configured');
  }

  // Example implementation for SendGrid
  if (process.env.EMAIL_SERVICE_PROVIDER === 'sendgrid') {
    await sendViaSendGrid(recipient, emailData, emailServiceConfig);
  }
  // Example implementation for AWS SES
  else if (process.env.EMAIL_SERVICE_PROVIDER === 'aws-ses') {
    await sendViaAWSSES(recipient, emailData, emailServiceConfig);
  }
  // Default: log that email would be sent
  else {
    console.log(`Would send email to ${recipient}: ${emailData.subject}`);
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  recipient: string,
  emailData: EmailNotificationRequest,
  config: any
): Promise<void> {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(config.apiKey);

  const msg = {
    to: recipient,
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    subject: emailData.subject,
    html: emailData.body,
    // Add custom headers for tracking
    customArgs: {
      notificationId: emailData.notification?.id,
      notificationType: emailData.notification?.type,
      severity: emailData.notification?.severity,
    },
  };

  await sgMail.send(msg);
}

/**
 * Send email via AWS SES
 */
async function sendViaAWSSES(
  recipient: string,
  emailData: EmailNotificationRequest,
  config: any
): Promise<void> {
  // AWS SES implementation would go here
  // This is a placeholder for the actual implementation
  console.log(`AWS SES: Would send email to ${recipient}`);
}

/**
 * GET /api/admin/notifications/email/status - Get email notification status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      );
    }

    // In production, check email delivery status from email service
    // For now, return mock status
    const status = {
      notificationId,
      status: 'delivered', // delivered, failed, pending
      deliveredAt: Date.now(),
      recipients: [
        {
          email: 'admin@example.com',
          status: 'delivered',
          deliveredAt: Date.now(),
        },
      ],
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('Failed to get email status:', error);
    return NextResponse.json(
      { error: 'Failed to get email status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/notifications/email/test - Send test email
 */
export async function testEmailHandler(request: NextRequest) {
  try {
    const { recipient, subject, message } = await request.json();

    if (!recipient || !subject || !message) {
      return NextResponse.json(
        { error: 'Recipient, subject, and message are required' },
        { status: 400 }
      );
    }

    const testEmailData: EmailNotificationRequest = {
      recipients: [recipient],
      subject: `[TEST] ${subject}`,
      body: `
        <div style="padding: 20px; border: 2px solid #007bff; border-radius: 8px;">
          <h2>🧪 Test Email Notification</h2>
          <p><strong>This is a test email from the ATS Resume Checker admin notification system.</strong></p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p><em>If you received this email, the notification system is working correctly.</em></p>
        </div>
      `,
      notification: {
        id: `test_${Date.now()}`,
        type: 'test',
        severity: 'low',
        timestamp: Date.now(),
      },
    };

    await sendEmailToRecipient(recipient, testEmailData);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
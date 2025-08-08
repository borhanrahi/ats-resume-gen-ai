/**
 * API endpoint for sending test email notifications
 * Allows admins to test the email notification system
 * Requirements: 13.3, 13.4 - System monitoring with email alerts testing
 */

import { NextRequest, NextResponse } from 'next/server';

export interface TestEmailRequest {
  recipient: string;
  subject?: string;
  message?: string;
  template?: 'basic' | 'critical' | 'system_error' | 'security';
}

/**
 * POST /api/admin/notifications/email/test - Send test email
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const isAdmin = await verifyAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const testData: TestEmailRequest = await request.json();

    // Validate request
    if (!testData.recipient) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testData.recipient)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const template = testData.template || 'basic';
    const subject = testData.subject || getDefaultSubject(template);
    const message = testData.message || getDefaultMessage(template);

    // Create test email data
    const emailData = {
      recipients: [testData.recipient],
      subject: `[TEST] ${subject}`,
      body: generateTestEmailBody(template, message),
      notification: {
        id: `test_${Date.now()}`,
        type: 'test',
        severity: 'low',
        timestamp: Date.now(),
      },
    };

    // Send test email using the main email endpoint logic
    const result = await sendTestEmail(emailData);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: testData.recipient,
      template,
      timestamp: Date.now(),
      result,
    });

  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/notifications/email/test/templates - Get available test templates
 */
export async function GET() {
  try {
    const templates = [
      {
        id: 'basic',
        name: 'Basic Test',
        description: 'Simple test email to verify email delivery',
        defaultSubject: 'Email Notification Test',
        defaultMessage: 'This is a basic test of the email notification system.',
      },
      {
        id: 'critical',
        name: 'Critical Alert Test',
        description: 'Test critical error alert formatting',
        defaultSubject: 'Critical System Alert Test',
        defaultMessage: 'This is a test of critical error alert notifications.',
      },
      {
        id: 'system_error',
        name: 'System Error Test',
        description: 'Test system error notification formatting',
        defaultSubject: 'System Error Notification Test',
        defaultMessage: 'This is a test of system error notifications.',
      },
      {
        id: 'security',
        name: 'Security Alert Test',
        description: 'Test security event notification formatting',
        defaultSubject: 'Security Alert Test',
        defaultMessage: 'This is a test of security alert notifications.',
      },
    ];

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('Failed to get test templates:', error);
    return NextResponse.json(
      { error: 'Failed to get test templates' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */
function getDefaultSubject(template: string): string {
  const subjects = {
    basic: 'Email Notification Test',
    critical: 'Critical System Alert Test',
    system_error: 'System Error Notification Test',
    security: 'Security Alert Test',
  };
  return subjects[template as keyof typeof subjects] || subjects.basic;
}

function getDefaultMessage(template: string): string {
  const messages = {
    basic: 'This is a basic test of the email notification system.',
    critical: 'This is a test of critical error alert notifications.',
    system_error: 'This is a test of system error notifications.',
    security: 'This is a test of security alert notifications.',
  };
  return messages[template as keyof typeof messages] || messages.basic;
}

function generateTestEmailBody(template: string, message: string): string {
  const timestamp = new Date().toISOString();
  const baseStyles = `
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  switch (template) {
    case 'critical':
      return `
        <div style="${baseStyles}">
          <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🚨 CRITICAL ALERT TEST</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <h2 style="color: #dc3545; margin-top: 0;">Test Critical Notification</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Severity:</strong> Critical</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> This is a test - no action required</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>✅ Test Result:</strong> If you received this email, critical alert notifications are working correctly.
            </p>
          </div>
        </div>
      `;

    case 'system_error':
      return `
        <div style="${baseStyles}">
          <div style="background: #fd7e14; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ SYSTEM ERROR TEST</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #fd7e14;">
            <h2 style="color: #fd7e14; margin-top: 0;">Test System Error Notification</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Severity:</strong> High</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Component:</strong> Notification System Test</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>✅ Test Result:</strong> System error notifications are functioning properly.
            </p>
          </div>
        </div>
      `;

    case 'security':
      return `
        <div style="${baseStyles}">
          <div style="background: #6f42c1; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🔒 SECURITY ALERT TEST</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6f42c1;">
            <h2 style="color: #6f42c1; margin-top: 0;">Test Security Event Notification</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Severity:</strong> High</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Event Type:</strong> Test Security Event</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>✅ Test Result:</strong> Security alert notifications are working as expected.
            </p>
          </div>
        </div>
      `;

    default: // basic
      return `
        <div style="${baseStyles}">
          <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🧪 EMAIL NOTIFICATION TEST</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h2 style="color: #007bff; margin-top: 0;">Test Email Notification</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Purpose:</strong> Testing email notification delivery</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px;">
            <p style="margin: 0; color: #155724;">
              <strong>✅ Success:</strong> If you received this email, the notification system is working correctly!
            </p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #495057;">System Information</h3>
            <ul style="color: #6c757d;">
              <li>Email Service: Active</li>
              <li>Template Rendering: Working</li>
              <li>Delivery Status: Successful</li>
              <li>Test Type: Basic Functionality</li>
            </ul>
          </div>
        </div>
      `;
  }
}

async function sendTestEmail(emailData: any): Promise<any> {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 TEST EMAIL NOTIFICATION (DEV MODE):');
      console.log(`To: ${emailData.recipients[0]}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log('Body: [HTML content rendered]');
      console.log('---');
      
      return {
        status: 'sent',
        method: 'development_log',
        timestamp: Date.now(),
      };
    }

    // In production, use the actual email service
    const response = await fetch('/api/admin/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
}
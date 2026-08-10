'use server';

import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface SendEmailResult {
  success: boolean;
  message: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<SendEmailResult> {
  const { name, email, message } = data;

  // Validate inputs
  if (!name || !name.trim()) {
    return { success: false, message: 'Name is required.' };
  }
  if (!email || !email.trim()) {
    return { success: false, message: 'Email is required.' };
  }
  if (!message || !message.trim()) {
    return { success: false, message: 'Message is required.' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Check SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const toEmail = process.env.SMTP_TO_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail || !toEmail) {
    console.error('[SMTP DEBUG] Missing SMTP configuration:', {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPassword: !!smtpPassword,
      hasFrom: !!fromEmail,
      hasTo: !!toEmail,
    });
    return {
      success: false,
      message: 'Email service is not configured. Please contact the administrator.',
    };
  }

  console.log('[SMTP DEBUG] Creating transporter with config:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    user: smtpUser,
    from: fromEmail,
    to: toEmail,
  });

  // Create the SMTP transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for port 465, false for 587
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      // Allow self-signed certificates (useful for Proton Mail Bridge)
      rejectUnauthorized: false,
    },
  });

  // Email content
  const mailOptions = {
    from: `"StewardWorks Contact Form" <${fromEmail}>`,
    to: toEmail,
    replyTo: email.trim(),
    subject: `New Contact Form Submission from ${name.trim()}`,
    text: `
New contact form submission:

Name: ${name.trim()}
Email: ${email.trim()}

Message:
${message.trim()}

---
Sent from StewardWorks Contact Form
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016; border-bottom: 2px solid #c9a84c; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 100px;">Name:</td>
            <td style="padding: 8px 12px;">${name.trim()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 8px 12px;">
              <a href="mailto:${email.trim()}" style="color: #2d5016;">${email.trim()}</a>
            </td>
          </tr>
        </table>
        <div style="background: #f9f7f0; border-left: 4px solid #c9a84c; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #333;">Message:</h3>
          <p style="margin: 0; white-space: pre-line; color: #444;">${message.trim()}</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Sent from StewardWorks Contact Form
        </p>
      </div>
    `.trim(),
  };

  try {
    console.log('[SMTP DEBUG] Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP DEBUG] Email sent successfully!', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return {
      success: true,
      message: 'Email sent successfully! We will get back to you soon.',
    };
  } catch (error: unknown) {
    const err = error as Error & { code?: string; responseCode?: number };
    console.error('[SMTP DEBUG] Failed to send email:', {
      errorMessage: err.message,
      errorCode: err.code,
      responseCode: err.responseCode,
      stack: err.stack,
    });
    return {
      success: false,
      message: 'Failed to send email. Please try again later or contact us directly.',
    };
  }
}

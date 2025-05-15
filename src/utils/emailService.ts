import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from './logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  body: (data: any) => string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Record<string, EmailTemplate> = {};

  constructor() {
    // Initialize with default configuration
    // In production, you would use actual SMTP credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASSWORD || 'password',
      },
    });

    // Register email templates
    this.registerTemplates();
  }

  private registerTemplates() {
    // Invoice notification template
    this.templates.invoiceNotification = {
      subject: 'New Invoice #{{invoiceNumber}} from {{companyName}}',
      body: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">INVOICE</h1>
            <p style="margin: 5px 0 0 0;">Invoice #${data.invoiceNumber}</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${data.clientName},</p>
            <p>Please find below the details of your invoice:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Due Date:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.dueDate}</td>
                </tr>
              </table>
            </div>
            
            <h3 style="border-bottom: 2px solid #2c3e50; padding-bottom: 8px; color: #2c3e50;">Invoice Summary</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${data.subtotal}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Tax (${data.taxRate}%):</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${data.taxAmount}</td>
              </tr>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td style="padding: 10px; border-bottom: 2px solid #2c3e50;"><strong>Total Amount Due:</strong></td>
                <td style="padding: 10px; border-bottom: 2px solid #2c3e50; text-align: right; color: #2c3e50;">${data.total}</td>
              </tr>
            </table>
            
            <p>Please log in to your client portal to view the complete invoice details and make a payment.</p>
            
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <p style="margin-top: 30px;">Regards,<br>${data.companyName}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    // Case update notification template
    this.templates.caseUpdate = {
      subject: 'Update on Your Case: {{caseReference}}',
      body: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Case Update: ${data.caseReference}</h2>
          <p>Dear ${data.clientName},</p>
          <p>There has been an update on your case:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p>${data.updateDetails}</p>
          </div>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Regards,<br>${data.attorneyName}<br>${data.companyName}</p>
        </div>
      `,
    };

    // Document ready notification template
    this.templates.documentReady = {
      subject: 'Document Ready for Review: {{documentTitle}}',
      body: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Ready for Review</h2>
          <p>Dear ${data.clientName},</p>
          <p>A new document is ready for your review:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Document:</strong> ${data.documentTitle}</p>
            <p><strong>Related to:</strong> ${data.caseReference || 'General'}</p>
          </div>
          <p>Please log in to your client portal to view and sign this document if required.</p>
          <p>Regards,<br>${data.companyName}</p>
        </div>
      `,
    };
    
    // Appointment reminder template
    this.templates.appointmentReminder = {
      subject: 'Appointment Reminder: {{appointmentType}} on {{appointmentDate}}',
      body: (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>Dear ${data.clientName},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Type:</strong> ${data.appointmentType}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Attorney:</strong> ${data.attorneyName}</p>
          </div>
          <p>If you need to reschedule, please contact our office as soon as possible.</p>
          <p>Regards,<br>${data.companyName}</p>
        </div>
      `,
    };
  }

  /**
   * Send an email using a predefined template
   */
  async sendTemplateEmail(templateName: string, to: string | string[], data: any): Promise<boolean> {
    try {
      const template = this.templates[templateName];
      if (!template) {
        logger.error(`Email template '${templateName}' not found`);
        return false;
      }

      // Process subject line - replace placeholders
      let subject = template.subject;
      Object.keys(data).forEach(key => {
        subject = subject.replace(`{{${key}}}`, data[key]);
      });

      // Generate HTML body from template
      const html = template.body(data);

      // Send email
      return await this.sendEmail({
        to,
        subject,
        html,
      });
    } catch (error) {
      logger.error('Error sending template email:', error);
      return false;
    }
  }

  /**
   * Send a custom email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Law Firm <no-reply@lawfirm.com>',
        ...options,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

// Export as singleton
export default new EmailService();
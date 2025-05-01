import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Settings from '../models/settings.model';
import logger from '../utils/logger';
import emailService from '../utils/emailService';

/**
 * Get company settings
 * @route GET /api/settings
 */
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find settings or create default if none exists
    const settings = await Settings.findOneOrCreate();
    
    res.status(httpStatus.OK).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error retrieving settings:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update company settings
 * @route PUT /api/settings
 */
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if none exists
      const newSettings = await Settings.create(req.body);
      res.status(httpStatus.CREATED).json({
        success: true,
        data: newSettings,
        message: 'Settings created successfully',
      });
      return;
    }
    
    // Update existing settings
    const updatedSettings = await Settings.findByIdAndUpdate(
      settings._id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(httpStatus.OK).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Test email configuration
 * @route POST /api/settings/test-email
 */
export const testEmailConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Test email address is required',
      });
      return;
    }
    
    // Get current settings
    const settings = await Settings.findOne();
    if (!settings) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Settings not found',
      });
      return;
    }
    
    // Verify SMTP connection
    const connectionVerified = await emailService.verifyConnection();
    if (!connectionVerified) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Failed to connect to email server. Please check your SMTP settings.',
      });
      return;
    }
    
    // Send test email
    const emailSent = await emailService.sendEmail({
      to: testEmail,
      subject: 'Test Email from Law Firm Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email from ${settings.companyName}.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p>Regards,<br>${settings.companyName}</p>
        </div>
      `,
    });
    
    if (emailSent) {
      res.status(httpStatus.OK).json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send test email',
      });
    }
  } catch (error) {
    logger.error('Error testing email configuration:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
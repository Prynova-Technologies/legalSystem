import Settings from '../models/settings.model';
import logger from '../utils/logger';
import emailService from '../utils/emailService';

/**
 * Service for settings-related operations
 */
export class SettingsService {
  /**
   * Get company settings
   */
  static async getSettings(): Promise<any> {
    try {
      // Find settings or create default if none exists
      return await Settings.findOneOrCreate();
    } catch (error) {
      logger.error('Error retrieving settings', { error });
      throw error;
    }
  }

  /**
   * Update company settings
   */
  static async updateSettings(settingsData: any): Promise<any> {
    try {
      const settings = await Settings.findOne();
      
      if (!settings) {
        // Create new settings if none exists
        const newSettings = await Settings.create(settingsData);
        logger.info('Settings created successfully');
        return newSettings;
      }
      
      // Update existing settings
      const updatedSettings = await Settings.findByIdAndUpdate(
        settings._id,
        settingsData,
        { new: true, runValidators: true }
      );
      
      logger.info('Settings updated successfully');
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating settings', { error, settingsData });
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!testEmail) {
        throw new Error('Test email address is required');
      }
      
      // Get current settings
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('Settings not found');
      }
      
      // Verify SMTP connection
      const connectionVerified = await emailService.verifyConnection();
      if (!connectionVerified) {
        throw new Error('Failed to connect to SMTP server');
      }
      
      // Send test email
      const emailSent = await emailService.sendEmail({
        to: testEmail,
        subject: 'Test Email from Law Practice Management System',
        html: '<p>This is a test email to verify your email configuration.</p>'
      });
      
      if (!emailSent) {
        throw new Error('Failed to send test email');
      }
      
      logger.info('Test email sent successfully', { testEmail });
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      logger.error('Error testing email configuration', { error, testEmail });
      throw error;
    }
  }

  /**
   * Get billing rate settings
   */
  static async getBillingRates(): Promise<any> {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        return [];
      }
      
      return settings.billingRates || [];
    } catch (error) {
      logger.error('Error retrieving billing rates', { error });
      throw error;
    }
  }

  /**
   * Update billing rate settings
   */
  static async updateBillingRates(billingRates: Array<{ name: string; rate: number; description?: string }>): Promise<any> {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('Settings not found');
      }
      
      settings.billingRates = billingRates;
      await settings.save();
      
      logger.info('Billing rates updated successfully');
      return settings.billingRates;
    } catch (error) {
      logger.error('Error updating billing rates', { error, billingRates });
      throw error;
    }
  }

  /**
   * Get document types settings
   */
  static async getDocumentTypes(): Promise<any> {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        return [];
      }
      
      return settings.documentTypes || [];
    } catch (error) {
      logger.error('Error retrieving document types', { error });
      throw error;
    }
  }

  /**
   * Update document types settings
   */
  static async updateDocumentTypes(documentTypes: Array<{ name: string; category?: string; description?: string }>): Promise<any> {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('Settings not found');
      }
      
      settings.documentTypes = documentTypes;
      await settings.save();
      
      logger.info('Document types updated successfully');
      return settings.documentTypes;
    } catch (error) {
      logger.error('Error updating document types', { error, documentTypes });
      throw error;
    }
  }
}
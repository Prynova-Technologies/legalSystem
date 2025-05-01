import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '../utils/logger';
import emailService from '../utils/emailService';
import Settings from '../models/settings.model';

/**
 * Send invoice notification to client
 * @route POST /api/notifications/invoice
 */
export const sendInvoiceNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientEmail, clientName, invoiceNumber, amount, dueDate } = req.body;

    // Validate required fields
    if (!clientEmail || !clientName || !invoiceNumber || !amount || !dueDate) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields for invoice notification',
      });
      return;
    }

    // Get company settings
    const settings = await Settings.findOne();
    if (!settings) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Company settings not found',
      });
      return;
    }

    // Check if invoice notifications are enabled
    if (!settings.notificationSettings.sendInvoiceNotifications) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invoice notifications are disabled in settings',
      });
      return;
    }

    // Send email notification
    const emailSent = await emailService.sendTemplateEmail('invoiceNotification', clientEmail, {
      clientName,
      invoiceNumber,
      amount,
      dueDate,
      companyName: settings.companyName,
    });

    if (emailSent) {
      res.status(httpStatus.OK).json({
        success: true,
        message: `Invoice notification sent to ${clientEmail}`,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send invoice notification',
      });
    }
  } catch (error) {
    logger.error('Error sending invoice notification:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send invoice notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Send case update notification to client
 * @route POST /api/notifications/case-update
 */
export const sendCaseUpdateNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientEmail, clientName, caseReference, updateDetails, attorneyName } = req.body;

    // Validate required fields
    if (!clientEmail || !clientName || !caseReference || !updateDetails) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields for case update notification',
      });
      return;
    }

    // Get company settings
    const settings = await Settings.findOne();
    if (!settings) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Company settings not found',
      });
      return;
    }

    // Check if case update notifications are enabled
    if (!settings.notificationSettings.sendCaseUpdateNotifications) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Case update notifications are disabled in settings',
      });
      return;
    }

    // Send email notification
    const emailSent = await emailService.sendTemplateEmail('caseUpdate', clientEmail, {
      clientName,
      caseReference,
      updateDetails,
      attorneyName: attorneyName || 'Your Attorney',
      companyName: settings.companyName,
    });

    if (emailSent) {
      res.status(httpStatus.OK).json({
        success: true,
        message: `Case update notification sent to ${clientEmail}`,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send case update notification',
      });
    }
  } catch (error) {
    logger.error('Error sending case update notification:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send case update notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Send document notification to client
 * @route POST /api/notifications/document
 */
export const sendDocumentNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientEmail, clientName, documentTitle, caseReference } = req.body;

    // Validate required fields
    if (!clientEmail || !clientName || !documentTitle) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields for document notification',
      });
      return;
    }

    // Get company settings
    const settings = await Settings.findOne();
    if (!settings) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Company settings not found',
      });
      return;
    }

    // Check if document notifications are enabled
    if (!settings.notificationSettings.sendDocumentNotifications) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Document notifications are disabled in settings',
      });
      return;
    }

    // Send email notification
    const emailSent = await emailService.sendTemplateEmail('documentReady', clientEmail, {
      clientName,
      documentTitle,
      caseReference,
      companyName: settings.companyName,
    });

    if (emailSent) {
      res.status(httpStatus.OK).json({
        success: true,
        message: `Document notification sent to ${clientEmail}`,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send document notification',
      });
    }
  } catch (error) {
    logger.error('Error sending document notification:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send document notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Send appointment reminder notification to client
 * @route POST /api/notifications/appointment
 */
export const sendAppointmentReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientEmail, clientName, appointmentDate, appointmentTime, appointmentType, location, attorneyName } = req.body;

    // Validate required fields
    if (!clientEmail || !clientName || !appointmentDate || !appointmentTime || !appointmentType) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields for appointment reminder',
      });
      return;
    }

    // Get company settings
    const settings = await Settings.findOne();
    if (!settings) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Company settings not found',
      });
      return;
    }

    // Check if appointment notifications are enabled
    if (!settings.notificationSettings.sendAppointmentReminders) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Appointment reminders are disabled in settings',
      });
      return;
    }

    // Send email notification
    const emailSent = await emailService.sendTemplateEmail('appointmentReminder', clientEmail, {
      clientName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      location: location || settings.address,
      attorneyName: attorneyName || 'Your Attorney',
      companyName: settings.companyName,
    });

    if (emailSent) {
      res.status(httpStatus.OK).json({
        success: true,
        message: `Appointment reminder sent to ${clientEmail}`,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send appointment reminder',
      });
    }
  } catch (error) {
    logger.error('Error sending appointment reminder:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send appointment reminder',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
import mongoose, { Schema } from 'mongoose';
import { ISettings, ISettingsModel } from '../interfaces/settings.interface';

const settingsSchema = new Schema<ISettings>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    emailSettings: {
      smtpHost: {
        type: String,
        required: [true, 'SMTP host is required'],
        default: 'smtp.example.com',
      },
      smtpPort: {
        type: Number,
        required: [true, 'SMTP port is required'],
        default: 587,
      },
      smtpUser: {
        type: String,
        required: [true, 'SMTP user is required'],
        default: 'user@example.com',
      },
      smtpPassword: {
        type: String,
        required: [true, 'SMTP password is required'],
        default: 'password',
      },
      smtpSecure: {
        type: Boolean,
        default: false,
      },
      emailFrom: {
        type: String,
        required: [true, 'Email from address is required'],
        default: 'Law Firm <no-reply@lawfirm.com>',
      },
    },
    notificationSettings: {
      sendInvoiceNotifications: {
        type: Boolean,
        default: true,
      },
      sendCaseUpdateNotifications: {
        type: Boolean,
        default: true,
      },
      sendDocumentNotifications: {
        type: Boolean,
        default: true,
      },
      sendAppointmentReminders: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.findOneOrCreate = async function () {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  return this.create({
    companyName: 'Law Firm',
    email: 'contact@lawfirm.com',
    phone: '(123) 456-7890',
    address: '123 Legal Street, City, State, ZIP',
  });
};

const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', settingsSchema);

export default Settings;
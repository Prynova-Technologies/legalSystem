import mongoose, { Schema } from 'mongoose';
import { IDeviceSessionDocument } from '../interfaces/deviceSession.interface';

const deviceSessionSchema = new Schema<IDeviceSessionDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.String,
      ref: 'User',
      required: true,
      index: true
    },
    deviceInfo: {
      userAgent: {
        type: String,
        required: true
      },
      ip: {
        type: String,
        required: true
      },
      deviceId: String,
      deviceType: String,
      browser: String,
      os: String,
      timestamp: {
        type: Date,
        required: true
      }
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    loginTime: {
      type: Date,
      default: Date.now
    },
    logoutTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
deviceSessionSchema.index({ userId: 1, 'deviceInfo.deviceId': 1 });
deviceSessionSchema.index({ isActive: 1 });
deviceSessionSchema.index({ lastActive: 1 });

const DeviceSession = mongoose.model<IDeviceSessionDocument>('DeviceSession', deviceSessionSchema);

export default DeviceSession;
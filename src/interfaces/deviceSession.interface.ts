import { Document } from 'mongoose';
import { IDeviceInfo } from '../middlewares/deviceTracker';

/**
 * Interface for device session data
 */
export interface IDeviceSession {
  userId: string;
  deviceInfo: IDeviceInfo;
  lastActive: Date;
  isActive: boolean;
  loginTime: Date;
  logoutTime?: Date;
}

/**
 * Interface for device session document with Mongoose methods
 */
export interface IDeviceSessionDocument extends IDeviceSession, Document {
  createdAt: Date;
  updatedAt: Date;
}
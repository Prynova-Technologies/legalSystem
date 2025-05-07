import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

export interface IActivity extends Document {
  case: mongoose.Types.ObjectId;
  action: string;
  description: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Activity action is required'],
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
activitySchema.index({ case: 1 });
activitySchema.index({ performedBy: 1 });
activitySchema.index({ timestamp: 1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
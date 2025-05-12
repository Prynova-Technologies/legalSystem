import mongoose, { Schema } from 'mongoose';
import { ITimeEntryDocument, ITimeEntryModel } from '../interfaces/timeEntry.interface';

const timeEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: Date,
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 0,
    },
    billable: {
      type: Boolean,
      default: true,
    },
    billingRate: {
      type: Number,
      min: 0,
      required: false
    },
    billableAmount: {
      type: Number,
      min: 0,
      required: false
    },
    invoiced: {
      type: Boolean,
      default: false,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: false
    },
    notes: String,
    tags: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Methods
timeEntrySchema.methods.calculateBillableAmount = function (): number {
  if (!this.billable || !this.billingRate) return 0;
  
  // Convert duration from minutes to hours and multiply by rate
  const hours = this.duration / 60;
  const amount = hours * this.billingRate;
  
  // Update the billableAmount field
  this.billableAmount = parseFloat(amount.toFixed(2));
  return this.billableAmount;
};

timeEntrySchema.methods.markAsInvoiced = function (invoiceId: string): void {
  this.invoiced = true;
  this.invoice = invoiceId;
  this.save();
};

// Static methods
timeEntrySchema.statics.getTotalHoursByUser = async function (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalMinutes / 60 : 0;
};

timeEntrySchema.statics.getTotalHoursByCase = async function (caseId: string): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        case: new mongoose.Types.ObjectId(caseId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalMinutes / 60 : 0;
};

timeEntrySchema.statics.getUnbilledEntries = async function (): Promise<ITimeEntryDocument[]> {
  return this.find({
    billable: true,
    invoiced: false,
    isDeleted: false,
  })
    .populate('user', 'firstName lastName')
    .populate('case', 'caseNumber title')
    .populate('task', 'title');
};

// Indexes
timeEntrySchema.index({ user: 1, startTime: 1 });
timeEntrySchema.index({ case: 1 });
timeEntrySchema.index({ task: 1 });
timeEntrySchema.index({ billable: 1, invoiced: 1 });

const TimeEntry = mongoose.model<ITimeEntryDocument, ITimeEntryModel>('TimeEntry', timeEntrySchema);

export default TimeEntry;
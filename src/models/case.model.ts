import mongoose, { Schema } from 'mongoose';
import { ICaseDocument, ICaseModel, CaseStatus, CaseType } from '../interfaces/case.interface';

const casePartySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['plaintiff', 'defendant', 'witness', 'expert', 'other'],
      required: true,
    },
    contact: String,
    email: String,
    notes: String,
  },
  { _id: true }
);

const caseActivitySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const caseSchema = new Schema<ICaseDocument, ICaseModel>(
  {
    caseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Case description is required'],
    },
    type: {
      type: String,
      enum: Object.values(CaseType),
      required: [true, 'Case type is required'],
    },
    status: {
      type: String,
      enum: Object.values(CaseStatus),
      default: CaseStatus.OPEN,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    clientRole: {
      type: String,
      enum: ['plaintiff', 'defendant'],
      required: [true, 'Client role is required'],
    },
    assignedAttorneys: [
      {
        attorney: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    assignedParalegals: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parties: [casePartySchema],
    courtDetails: {
      court: String,
      judge: String,
      jurisdiction: String,
      caseNumber: String,
      filingDate: Date,
    },
    openDate: {
      type: Date,
      default: Date.now,
    },
    closeDate: Date,
    // activityLog and notes are now standalone models

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

// Method to add activity to the case log (now uses Activity model)
caseSchema.methods.addActivity = async function (action: string, description: string, userId: string) {
  const Activity = mongoose.model('Activity');
  await Activity.create({
    case: this._id,
    action,
    description,
    performedBy: userId,
    timestamp: new Date(),
  });
};

caseSchema.methods.addNote = async function (client: string, content: string, userId: string) {
  const Note = mongoose.model('Note');
  await Note.create({
    case: this._id,
    client,
    content,
    createdBy: userId,
    timestamp: new Date(),
  });
};

// Static method to generate a unique case number
caseSchema.statics.generateCaseNumber = async function (): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Find the highest case number for the current year/month
  const prefix = `${year}${month}-`;
  const lastCase = await this.findOne(
    { caseNumber: { $regex: `^${prefix}` } },
    { caseNumber: 1 },
    { sort: { caseNumber: -1 } }
  );
  
  let sequenceNumber = 1;
  if (lastCase) {
    const lastSequence = parseInt(lastCase.caseNumber.split('-')[1], 10);
    sequenceNumber = lastSequence + 1;
  }
  
  return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
};

// Index for efficient queries
caseSchema.index({ client: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ type: 1 });
caseSchema.index({ assignedAttorneys: 1 });
caseSchema.index({ 'parties.name': 1 });

const Case = mongoose.model<ICaseDocument, ICaseModel>('Case', caseSchema);

export default Case;
import mongoose, { Schema } from 'mongoose';
import { IClientDocument, IClientModel } from '../interfaces/client.interface';

const clientContactSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['phone', 'email', 'address', 'other'],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    notes: String,
  },
  { _id: true }
);

const addressSchema = new Schema(
  {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const clientSchema = new Schema<IClientDocument, IClientModel>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    clientType: {
      type: String,
      enum: ['individual', 'organization'],
      default: 'individual',
    },
    dateOfBirth: {
      type: Date,
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
    },
    company: {
      type: String,
      trim: true,
    },
    contacts: [clientContactSchema],
    address: addressSchema,
    primaryAttorney: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referralSource: String,
    intakeDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
    kycDocuments: [String],
    conflictCheckCompleted: {
      type: Boolean,
      default: false,
    },
    conflictCheckNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
clientSchema.virtual('fullName').get(function (this: IClientDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to get all cases for this client
clientSchema.virtual('cases', {
  ref: 'Case',
  localField: '_id',
  foreignField: 'client',
});

// Static method to find clients by name
clientSchema.statics.findByName = function (name: string) {
  const regex = new RegExp(name, 'i');
  return this.find({
    $or: [
      { firstName: { $regex: regex } },
      { lastName: { $regex: regex } },
      { company: { $regex: regex } },
    ],
  });
};

// Ensure at least one contact is marked as primary
clientSchema.pre('save', function (next) {
  if (this.contacts && this.contacts.length > 0) {
    // Check if there's already a primary contact
    const hasPrimary = this.contacts.some((contact) => contact.isPrimary);
    
    // If no primary contact, set the first one as primary
    if (!hasPrimary) {
      this.contacts[0].isPrimary = true;
    }
  }
  next();
});

const Client = mongoose.model<IClientDocument, IClientModel>('Client', clientSchema);

export default Client;
import mongoose, { Schema } from 'mongoose';
import { Document, Model } from 'mongoose';

export interface INote extends Document {
  case: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
noteSchema.index({ case: 1 });
noteSchema.index({ client: 1 });
noteSchema.index({ createdBy: 1 });
noteSchema.index({ createdAt: 1 });

const Note = mongoose.model<INote>('Note', noteSchema);

export default Note;
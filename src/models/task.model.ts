import mongoose, { Schema } from 'mongoose';
import { ITaskDocument, TaskPriority, TaskStatus } from '../interfaces/task.interface';

const taskReminderSchema = new Schema(
  {
    reminderDate: {
      type: Date,
      required: true,
    },
    sent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
  },
  { _id: true }
);

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have an assigner'],
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: Date,
    estimatedHours: Number,
    actualHours: Number,
    billable: {
      type: Boolean,
      default: true,
    },
    reminders: [taskReminderSchema],
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
taskSchema.methods.addReminder = function (reminderDate: Date): void {
  this.reminders.push({
    reminderDate,
    sent: false,
  });
  this.save();
};

taskSchema.methods.markReminderSent = function (reminderId: string): boolean {
  const reminder = this.reminders.id(reminderId);
  if (!reminder) return false;

  reminder.sent = true;
  reminder.sentAt = new Date();
  this.save();
  return true;
};

taskSchema.methods.isOverdue = function (): boolean {
  if (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.CANCELLED) {
    return false;
  }
  return new Date() > this.dueDate;
};

// Indexes
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ case: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ tags: 1 });

const Task = mongoose.model<ITaskDocument>('Task', taskSchema);

export default Task;
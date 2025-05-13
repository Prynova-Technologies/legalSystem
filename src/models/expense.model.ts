import mongoose, { Schema } from 'mongoose';
import { IExpenseDocument, IExpenseModel, ExpenseCategory, ExpenseStatus } from '../interfaces/expense.interface';

const expenseSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Category is required'],
    },
    billable: {
      type: Boolean,
      default: true,
    },
    billableAmount: {
      type: Number,
      min: 0,
    },
    receiptUrl: String,
    notes: String,
    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.PENDING,
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter is required'],
    },
    isApproved: {
        type: Boolean,
        default: false,
      },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    invoiced: {
      type: Boolean,
      default: false,
    },
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
expenseSchema.methods.markAsBilled = function(invoiceId: string): void {
  this.invoiced = true;
  this.invoice = invoiceId;
  this.status = ExpenseStatus.BILLED;
  this.save();
};

expenseSchema.methods.calculateBillableAmount = function(markupPercentage = 0): number {
  if (!this.billable) return 0;
  
  const markup = 1 + (markupPercentage / 100);
  const amount = this.amount * markup;
  
  // Update the billableAmount field
  this.billableAmount = parseFloat(amount.toFixed(2));
  return this.billableAmount;
};

// Static methods
expenseSchema.statics.getUnbilledExpenses = async function(): Promise<IExpenseDocument[]> {
  return this.find({
    billable: true,
    invoiced: false,
    isDeleted: false,
  })
    .populate('submittedBy', 'firstName lastName')
    .populate('case', 'caseNumber title')
    .populate('client', 'firstName lastName company');
};

expenseSchema.statics.getTotalExpensesByCase = async function(caseId: string): Promise<number> {
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
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

expenseSchema.statics.getTotalExpensesByCategory = async function(
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const result = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result.reduce((acc: Record<string, number>, curr: { _id: string; total: number }) => {
    acc[curr._id] = curr.total;
    return acc;
  }, {});
};

// Indexes
expenseSchema.index({ submittedBy: 1, date: 1 });
expenseSchema.index({ case: 1 });
expenseSchema.index({ client: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ billable: 1, invoiced: 1 });
expenseSchema.index({ status: 1 });

const Expense = mongoose.model<IExpenseDocument, IExpenseModel>('Expense', expenseSchema);

export default Expense;
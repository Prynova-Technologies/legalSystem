import mongoose, { Schema } from 'mongoose';
import { IInvoiceDocument, IInvoiceModel, InvoiceStatus, PaymentMethod } from '../interfaces/billing.interface';

const invoiceItemSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: 0,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    timeEntry: {
      type: Schema.Types.ObjectId,
      ref: 'TimeEntry',
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  { _id: true }
);

const invoicePaymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0,
    },
    date: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    reference: String,
    notes: String,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who recorded payment is required'],
    },
  },
  { _id: true }
);

const invoiceSchema = new Schema<IInvoiceDocument, IInvoiceModel>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0,
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
    },
    payments: [invoicePaymentSchema],
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      min: 0,
    },
    notes: String,
    terms: String,
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
invoiceSchema.methods.addPayment = function (
  payment: Omit<any, 'recordedBy'>,
  userId: string
): void {
  this.payments.push({
    ...payment,
    recordedBy: userId,
  });

  // Update amount paid and balance
  this.amountPaid += payment.amount;
  this.balance = this.calculateBalance();
  
  // Update status based on new balance
  this.status = this.updateStatus();
  
  this.save();
};

invoiceSchema.methods.calculateBalance = function (): number {
  const balance = this.total - this.amountPaid;
  this.balance = parseFloat(balance.toFixed(2));
  return this.balance;
};

invoiceSchema.methods.updateStatus = function (): InvoiceStatus {
  const today = new Date();
  
  if (this.isDeleted) return InvoiceStatus.CANCELLED;
  
  if (this.balance <= 0) return InvoiceStatus.PAID;
  
  if (this.amountPaid > 0 && this.balance > 0) return InvoiceStatus.PARTIALLY_PAID;
  
  if (today > this.dueDate) return InvoiceStatus.OVERDUE;
  
  return this.status;
};

// Static methods
invoiceSchema.statics.generateInvoiceNumber = async function (): Promise<string> {
  const currentYear = new Date().getFullYear().toString();
  const prefix = `INV-${currentYear}-`;
  
  const lastInvoice = await this.findOne(
    { invoiceNumber: new RegExp(`^${prefix}`) },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  );
  
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }
  
  // Pad with zeros to ensure consistent format (e.g., INV-2023-00001)
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

invoiceSchema.statics.getOverdueInvoices = async function (): Promise<IInvoiceDocument[]> {
  const today = new Date();
  return this.find({
    dueDate: { $lt: today },
    status: { $nin: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
    isDeleted: false,
  })
    .populate('client', 'firstName lastName company')
    .populate('case', 'caseNumber title');
};

invoiceSchema.statics.getTotalRevenue = async function (
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        status: InvoiceStatus.PAID,
        'payments.date': { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalRevenue : 0;
};

// Indexes
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ case: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });

const Invoice = mongoose.model<IInvoiceDocument, IInvoiceModel>('Invoice', invoiceSchema);

export default Invoice;
// Type definitions for the application

// User type definition
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Re-export document types
export * from './documentTypes';

export enum UserRole {
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  PARALEGAL = 'paralegal',
  ASSISTANT = 'assistant',
  CLIENT = 'client'
}

// Case types
export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  caseType: CaseType;
  status: CaseStatus;
  clientId: string;
  assignedTo: string[];
  openDate: string;
  closeDate?: string;
  courtDetails?: CourtDetails;
  relatedParties: RelatedParty[];
  notes: Note[];
  documents: Document[];
  tasks: Task[];
  billingInfo: BillingInfo;
  history: CaseHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export enum CaseType {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  FAMILY = 'family',
  CORPORATE = 'corporate',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  REAL_ESTATE = 'real_estate',
  TAX = 'tax',
  IMMIGRATION = 'immigration',
  OTHER = 'other'
}

export enum CaseStatus {
  OPEN = 'open',
  PENDING = 'pending',
  AWAITING_RESPONSE = 'awaiting_response',
  DISCOVERY = 'discovery',
  TRIAL_PREP = 'trial_prep',
  TRIAL = 'trial',
  APPEAL = 'appeal',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export interface CourtDetails {
  courtName: string;
  jurisdiction: string;
  judge?: string;
  courtroom?: string;
  filingNumber?: string;
}

export interface RelatedParty {
  id: string;
  name: string;
  type: 'plaintiff' | 'defendant' | 'witness' | 'expert' | 'other';
  contactInfo?: ContactInfo;
  notes?: string;
}

export interface CaseHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
}

// Client types
export interface Client {
  id: string;
  type: 'individual' | 'organization';
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  contactInfo: ContactInfo;
  cases: string[];
  intakeDate: string;
  kycVerified: boolean;
  kycDocuments: Document[];
  conflictCheckStatus: 'pending' | 'cleared' | 'flagged';
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Document types
export interface Document {
  id: string;
  name: string;
  description?: string;
  fileType: string;
  size: number;
  url: string;
  caseId?: string;
  clientId?: string;
  tags: string[];
  category: DocumentCategory;
  version: number;
  previousVersions?: string[];
  uploadedBy: string;
  uploadedAt: string;
  lastModifiedAt: string;
}

export enum DocumentCategory {
  PLEADING = 'pleading',
  MOTION = 'motion',
  EVIDENCE = 'evidence',
  CORRESPONDENCE = 'correspondence',
  CONTRACT = 'contract',
  COURT_ORDER = 'court_order',
  CLIENT_DOCUMENT = 'client_document',
  KYC = 'kyc',
  BILLING = 'billing',
  OTHER = 'other'
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  caseId?: string;
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
  reminderDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Calendar event types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  eventType: EventType;
  caseId?: string;
  attendees: string[];
  reminderTime?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum EventType {
  COURT_HEARING = 'court_hearing',
  DEPOSITION = 'deposition',
  CLIENT_MEETING = 'client_meeting',
  INTERNAL_MEETING = 'internal_meeting',
  DEADLINE = 'deadline',
  OTHER = 'other'
}

// Billing types
export interface BillingInfo {
  id: string;
  caseId: string;
  billingType: 'hourly' | 'flat_rate' | 'contingency';
  hourlyRate?: number;
  flatRate?: number;
  contingencyPercentage?: number;
  retainerAmount?: number;
  timeEntries: TimeEntry[];
  expenses: Expense[];
  invoices: Invoice[];
}

export interface TimeEntry {
  id: string;
  caseId: string;
  userId: string;
  description: string;
  date: string;
  duration: number; // in minutes
  billable: boolean;
  billed: boolean;
  rate: number;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  caseId: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  billable: boolean;
  billed: boolean;
  reimbursable: boolean;
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  caseId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  timeEntries: string[];
  expenses: string[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: 'time' | 'expense' | 'flat_fee' | 'other';
  timeEntryId?: string;
  expenseId?: string;
}

// Note types
export interface Note {
  id: string;
  content: string;
  caseId?: string;
  clientId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Communication types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  read: boolean;
  caseId?: string;
  attachments: Document[];
  createdAt: string;
}

// Report types
export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  parameters: Record<string, any>;
  createdBy: string;
  createdAt: string;
  lastRunAt?: string;
}

export enum ReportType {
  CASE_STATUS = 'case_status',
  BILLING_SUMMARY = 'billing_summary',
  TIME_TRACKING = 'time_tracking',
  CLIENT_ACTIVITY = 'client_activity',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom'
}
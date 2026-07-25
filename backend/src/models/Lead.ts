import { Schema, model, Document, Types } from 'mongoose';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: LeadStatus;
  source?: string;
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Lead phone number is required'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
      default: 'New',
    },
    source: {
      type: String,
      trim: true,
      default: 'Public Webform',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search on name, email, company
LeadSchema.index({ name: 'text', email: 'text', company: 'text' });

export const Lead = model<ILead>('Lead', LeadSchema);

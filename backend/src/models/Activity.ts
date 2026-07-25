import { Schema, model, Document, Types } from 'mongoose';

export type ActivityType = 'created' | 'status_change' | 'assigned' | 'note_added' | 'updated';

export interface IActivity extends Document {
  leadId: Types.ObjectId;
  userId?: Types.ObjectId;
  type: ActivityType;
  description: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['created', 'status_change', 'assigned', 'note_added', 'updated'],
      required: [true, 'Activity type is required'],
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log creation time
  }
);

export const Activity = model<IActivity>('Activity', ActivitySchema);

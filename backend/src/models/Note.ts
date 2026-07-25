import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  leadId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
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
      required: [true, 'User ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Note content cannot be empty'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Note = model<INote>('Note', NoteSchema);

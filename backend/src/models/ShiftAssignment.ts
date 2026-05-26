import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftAssignment extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  shiftTime: string; // e.g., '05:00 - 13:00'
  workstation: string; // e.g., 'SPM02 C'
  isLocked: boolean;
}

const ShiftAssignmentSchema: Schema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  shiftTime: { type: String, required: true },
  workstation: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

ShiftAssignmentSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IShiftAssignment>('ShiftAssignment', ShiftAssignmentSchema);

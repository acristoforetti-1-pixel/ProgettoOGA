import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkstation extends Document {
  name: string;
  department?: string;
  isCritical: boolean;
  defaultRequiredCount: number;
  skipsNight: boolean;
}

const WorkstationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  department: { type: String },
  isCritical: { type: Boolean, default: false },
  defaultRequiredCount: { type: Number, default: 1 },
  skipsNight: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IWorkstation>('Workstation', WorkstationSchema);

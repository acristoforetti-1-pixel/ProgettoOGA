import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string; // e.g., '901', 'OP-001'
  firstName: string;
  lastName: string;
  department: string; // e.g., 'Coating', 'Converting'
  role: string; // Native role, e.g., 'Assistente', 'Capo Reparto'
  isActive: boolean;
}

const EmployeeSchema: Schema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);

import mongoose, { Schema, Document } from 'mongoose';

export enum AbsenceType {
  FERIE = 'FERIE',
  PERMESSO = 'PERMESSO',
  MALATTIA = 'MALATTIA',
  L104 = '104'
}

export enum AbsenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IAbsence extends Document {
  employee: mongoose.Types.ObjectId;
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  status: AbsenceStatus;
  reason?: string;
}

const AbsenceSchema: Schema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: Object.values(AbsenceType), required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(AbsenceStatus), default: AbsenceStatus.PENDING },
  reason: { type: String },
}, { timestamps: true });

export default mongoose.model<IAbsence>('Absence', AbsenceSchema);

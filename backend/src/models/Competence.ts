import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetence extends Document {
  employee: mongoose.Types.ObjectId;
  workstation: string; // e.g., 'SPM02 C', 'SPM02 SC', 'BOB 1.1', 'CARICO'
  level: number; // 1: Abilitato/Mansione, 2: Addestrato, 3: In addestramento, 4: Limitazioni
  validUntil?: Date; // Optional expiration date for HSE/Muletto
}

const CompetenceSchema: Schema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  workstation: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 4 },
  validUntil: { type: Date },
}, { timestamps: true });

// Ensure an employee only has one entry per workstation
CompetenceSchema.index({ employee: 1, workstation: 1 }, { unique: true });

export default mongoose.model<ICompetence>('Competence', CompetenceSchema);

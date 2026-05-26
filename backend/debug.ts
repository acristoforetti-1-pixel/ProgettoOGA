import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/db';
import { generateSchedule } from './src/services/scheduler';
import ShiftAssignment from './src/models/ShiftAssignment';
import Employee from './src/models/Employee';
import Competence from './src/models/Competence';

async function test() {
  await connectDB();
  const startDate = new Date('2026-05-15T00:00:00.000Z');
  const lockedShifts = await ShiftAssignment.find({ date: { $gte: startDate }, isLocked: true }).populate('employee');
  console.log("Locked Shifts:", lockedShifts.map(ls => `${(ls.employee as any).lastName} -> ${ls.workstation} (${ls.shiftTime})`));
  
  const shifts = await generateSchedule(startDate, 1, lockedShifts);
  console.log("Generated Shifts:");
  shifts.forEach(s => console.log(`${s.employeeName} -> ${s.workstation} [${s.shiftTime}]`));
  
  process.exit(0);
}
test();

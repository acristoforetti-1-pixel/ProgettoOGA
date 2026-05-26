import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './backend/src/config/db';
import { generateSchedule } from './backend/src/services/scheduler';
import ShiftAssignment from './backend/src/models/ShiftAssignment';

async function test() {
  await connectDB();
  const startDate = new Date('2026-05-15T00:00:00.000Z');
  const lockedShifts = await ShiftAssignment.find({ date: { $gte: startDate }, isLocked: true }).populate('employee');
  console.log("Locked Shifts:", lockedShifts.length);
  const shifts = await generateSchedule(startDate, 1, lockedShifts);
  console.log("Generated Shifts:", shifts.length);
  console.log(shifts.map(s => `${s.employeeName} -> ${s.workstation} [${s.shiftTime}]`));
  process.exit(0);
}
test();

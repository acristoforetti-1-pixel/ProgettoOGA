import mongoose from 'mongoose';
import connectDB from './backend/src/config/db';
import { generateSchedule } from './backend/src/services/scheduler';
import ShiftAssignment from './backend/src/models/ShiftAssignment';
import Employee from './backend/src/models/Employee';
import Competence from './backend/src/models/Competence';

async function debug() {
  await connectDB();
  const startDate = new Date('2026-05-15T00:00:00.000Z');
  
  const lockedShifts = await ShiftAssignment.find({ date: { $gte: startDate }, isLocked: true }).populate('employee');
  console.log("Locked Shifts:", lockedShifts.map(ls => `${(ls.employee as any).lastName} -> ${ls.workstation} (${ls.shiftTime})`));
  
  const employees = await Employee.find({ isActive: true });
  console.log("Active Employees:", employees.length);
  
  const competences = await Competence.find({ level: { $lte: 3 } }).populate('employee');
  const spm02c = competences.filter(c => c.workstation.includes('SPM02 C'));
  console.log("Competences for SPM02 C:", spm02c.map(c => `${(c.employee as any).lastName} L${c.level}`));
  
  const shifts = await generateSchedule(startDate, 1, lockedShifts);
  console.log("Generated Shifts:");
  shifts.forEach(s => console.log(`${s.employeeName} -> ${s.workstation} [${s.shiftTime}]`));
  
  process.exit(0);
}
debug();

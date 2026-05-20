import { Types } from 'mongoose';
import Employee, { IEmployee } from '../models/Employee';
import Competence, { ICompetence } from '../models/Competence';
import Absence, { AbsenceStatus } from '../models/Absence';
import Workstation from '../models/Workstation';

export interface ScheduledShift {
  employee: Types.ObjectId;
  employeeName: string;
  date: Date;
  shiftTime: string;
  workstation: string;
}

export const generateSchedule = async (startDate: Date, days: number = 7) => {
  const employees = await Employee.find({ isActive: true });
  const competences = await Competence.find({ level: { $lte: 3 } }).populate('employee');
  const approvedAbsences = await Absence.find({ status: AbsenceStatus.APPROVED });

  const eligibleMap = new Map<string, { level1_2: string[], level3: string[] }>();

  competences.forEach(comp => {
    if (!eligibleMap.has(comp.workstation)) {
      eligibleMap.set(comp.workstation, { level1_2: [], level3: [] });
    }
    const empId = (comp.employee as unknown as IEmployee)._id.toString();
    if (comp.level <= 2) {
      if (!eligibleMap.get(comp.workstation)!.level1_2.includes(empId)) {
        eligibleMap.get(comp.workstation)!.level1_2.push(empId);
      }
    } else if (comp.level === 3) {
      if (!eligibleMap.get(comp.workstation)!.level3.includes(empId)) {
        eligibleMap.get(comp.workstation)!.level3.push(empId);
      }
    }
  });

  const scheduledShifts: ScheduledShift[] = [];
  const shiftTimes = ['05:00 - 13:00', '13:00 - 21:00', '21:00 - 05:00'];

  const workstations = await Workstation.find({});
  const dailyRequirements = workstations.map(ws => ({
    name: ws.name,
    requiredCount: ws.defaultRequiredCount,
    skipsNight: ws.skipsNight
  }));


  const tracking = new Map<string, Record<string, string>>();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split('T')[0];

    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const assignedToday = new Set<string>();

    for (const shiftTime of shiftTimes) {
      const isNight = shiftTime === '21:00 - 05:00';
      const isMorning = shiftTime === '05:00 - 13:00';

      for (const req of dailyRequirements) {
        if (isNight && req.skipsNight) continue;

        const eligibleLevel1_2 = eligibleMap.get(req.name)?.level1_2 || [];
        const eligibleLevel3 = eligibleMap.get(req.name)?.level3 || [];

        let assignedL1Count = 0;
        let assignedL3Count = 0;

        // Passaggio 1: Assegno Level 1/2
        for (const empId of eligibleLevel1_2) {
          if (assignedL1Count >= req.requiredCount) break;
          if (assignedToday.has(empId)) continue;

          const emp = employees.find(e => e._id.toString() === empId);
          if (!emp) continue;

          // Verifica Assenze
          const isAbsent = approvedAbsences.some(abs =>
            abs.employee.toString() === empId &&
            currentDate >= abs.startDate &&
            currentDate <= abs.endDate
          );
          if (isAbsent) continue;

          // Verifica HSE Limitation
          if (emp.hseLimitations && emp.hseLimitations.includes(req.name)) continue;

          // Verifica Riposo (11h)
          const yesterdayShift = tracking.get(empId)?.[yesterdayStr];
          if (yesterdayShift === '21:00 - 05:00' && shiftTime !== '21:00 - 05:00') continue;
          if (yesterdayShift === '13:00 - 21:00' && shiftTime === '05:00 - 13:00') continue;

          scheduledShifts.push({
            employee: emp._id,
            employeeName: `${emp.lastName} ${emp.firstName.charAt(0)}.`,
            date: currentDate,
            shiftTime,
            workstation: req.name
          });

          assignedToday.add(empId);
          assignedL1Count++;

          if (!tracking.has(empId)) tracking.set(empId, {});
          tracking.get(empId)![dateStr] = shiftTime;
        }

        // Passaggio 2: Assegno Level 3 (Solo se è già stato assegnato un 1/2)
        if (assignedL1Count > 0) {
          for (const empId of eligibleLevel3) {
            if (assignedL3Count >= 1) break;
            if (assignedToday.has(empId)) continue;

            const emp = employees.find(e => e._id.toString() === empId);
            if (!emp) continue;

            const isAbsent = approvedAbsences.some(abs =>
              abs.employee.toString() === empId &&
              currentDate >= abs.startDate &&
              currentDate <= abs.endDate
            );
            if (isAbsent) continue;

            // Verifica HSE Limitation
            if (emp.hseLimitations && emp.hseLimitations.includes(req.name)) continue;

            // Verifica Riposo (11h)
            const yesterdayShift = tracking.get(empId)?.[yesterdayStr];
            if (yesterdayShift === '21:00 - 05:00' && shiftTime !== '21:00 - 05:00') continue;
            if (yesterdayShift === '13:00 - 21:00' && shiftTime === '05:00 - 13:00') continue;

            scheduledShifts.push({
              employee: emp._id,
              employeeName: `${emp.lastName} ${emp.firstName.charAt(0)}. (Affiancamento)`,
              date: currentDate,
              shiftTime,
              workstation: req.name
            });

            assignedToday.add(empId);
            assignedL3Count++;

            if (!tracking.has(empId)) tracking.set(empId, {});
            tracking.get(empId)![dateStr] = shiftTime;
          }
        }

        // Alert se la posizione non viene coperta
        if (assignedL1Count < req.requiredCount) {
          console.warn(`[WARNING] Non è stato possibile coprire ${req.name} nel turno ${shiftTime} del ${dateStr} a causa di carenza personale o assenze.`);
        }
      }
    }
  }

  return scheduledShifts;
};

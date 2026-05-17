import { Types } from 'mongoose';
import Employee, { IEmployee } from '../models/Employee';
import Competence, { ICompetence } from '../models/Competence';
import Absence, { AbsenceStatus } from '../models/Absence';

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
  
  // Full requirements list expanded with the latest "mansioni" list
  const dailyRequirements = [
    // COATING UNIT
    { name: 'SPM02 C', requiredCount: 1, skipsNight: false },
    { name: 'SPM02 SC', requiredCount: 1, skipsNight: false },
    { name: 'SPM02 AM', requiredCount: 1, skipsNight: false },
    { name: 'SPM02 TC', requiredCount: 1, skipsNight: false },
    { name: 'SPM02 SCS', requiredCount: 1, skipsNight: false },
    { name: 'SPM02 SCA', requiredCount: 1, skipsNight: false },
    { name: 'SPM03 C', requiredCount: 1, skipsNight: false },
    { name: 'SPM03 SC', requiredCount: 1, skipsNight: false },
    { name: 'SPM03 AM', requiredCount: 1, skipsNight: false },
    { name: 'SPM04 C', requiredCount: 1, skipsNight: false },
    { name: 'SPM04 SC', requiredCount: 1, skipsNight: false },
    { name: 'SPM04 AM', requiredCount: 1, skipsNight: false },
    { name: 'SPM04 TC', requiredCount: 1, skipsNight: false },
    { name: 'AUX', requiredCount: 1, skipsNight: true },
    { name: 'ASSISTENTE', requiredCount: 1, skipsNight: false },

    // CONVERTING UNIT & LOGISTICS
    { name: 'BOB 1.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 1.3', requiredCount: 1, skipsNight: false },
    { name: 'BOB 1.4', requiredCount: 1, skipsNight: false },
    { name: 'BOB 2.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 2.2', requiredCount: 1, skipsNight: false },
    { name: 'BOB 2.4', requiredCount: 1, skipsNight: false },
    { name: 'BOB 3.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 3.2', requiredCount: 1, skipsNight: false },
    { name: 'BOB 3.3', requiredCount: 1, skipsNight: false },
    { name: 'BOB 3.5', requiredCount: 1, skipsNight: false },
    { name: 'BOB 4.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 4.3', requiredCount: 1, skipsNight: false },
    { name: 'BOB 4.4', requiredCount: 1, skipsNight: false },
    { name: 'BOB 5.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 5.2', requiredCount: 1, skipsNight: false },
    { name: 'BOB 5.3', requiredCount: 1, skipsNight: false },
    { name: 'BOB 6.1', requiredCount: 1, skipsNight: false },
    { name: 'BOB 6.2', requiredCount: 1, skipsNight: false },
    { name: 'RIB 01', requiredCount: 1, skipsNight: false },
    { name: 'RIB 02', requiredCount: 1, skipsNight: false },
    { name: 'RIBOBINATRICE', requiredCount: 1, skipsNight: false },
    { name: 'TAGL ANIME', requiredCount: 1, skipsNight: true },
    { name: 'TAGLIABUSTE', requiredCount: 1, skipsNight: true },
    { name: 'ASS.', requiredCount: 1, skipsNight: false },
    { name: 'RISME GIORNATA', requiredCount: 1, skipsNight: true },
    { name: 'PICKING', requiredCount: 1, skipsNight: false },
    { name: 'NAVETTAGGIO', requiredCount: 1, skipsNight: false },
    { name: 'MANIPOLATORE', requiredCount: 1, skipsNight: false },
    { name: 'TRASP.', requiredCount: 1, skipsNight: false },
    { name: 'JOLLY', requiredCount: 1, skipsNight: false },
    { name: 'CQ', requiredCount: 1, skipsNight: false },
    { name: 'ADE', requiredCount: 1, skipsNight: false },
    { name: 'PREPOSTO', requiredCount: 1, skipsNight: false },
    { name: 'CARR', requiredCount: 1, skipsNight: false },
    { name: 'SBOB', requiredCount: 1, skipsNight: false },
    { name: 'JUMBO', requiredCount: 1, skipsNight: false },
    { name: 'ANALISTA', requiredCount: 1, skipsNight: true },
    { name: 'Cucina adesivi', requiredCount: 1, skipsNight: true },
    { name: 'MAN 1', requiredCount: 1, skipsNight: false },
    { name: 'MAN 2', requiredCount: 1, skipsNight: false },
    { name: 'MAN 3', requiredCount: 1, skipsNight: false },
    { name: 'MAN 4', requiredCount: 1, skipsNight: false },
    { name: 'MAN 5', requiredCount: 1, skipsNight: false },
    { name: 'FAS 1', requiredCount: 1, skipsNight: false },
    { name: 'FAS 2', requiredCount: 1, skipsNight: false },
    { name: 'FAS 3', requiredCount: 1, skipsNight: false },
    { name: 'FASCIATRICE', requiredCount: 1, skipsNight: false },
    { name: 'CARICO', requiredCount: 1, skipsNight: false },
    { name: 'RIBALTA', requiredCount: 1, skipsNight: false },
    { name: 'MAGAZ. CARREL.', requiredCount: 1, skipsNight: false },
    { name: 'Moto scopa', requiredCount: 1, skipsNight: true },
    { name: 'ABILITAZ. MULETTO', requiredCount: 1, skipsNight: false },
    { name: 'ABILITAZ. MULETTO CON PINZA', requiredCount: 1, skipsNight: false }
  ];

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

        // Pass 1: Assign Level 1/2 (Autonomous)
        for (const empId of eligibleLevel1_2) {
          if (assignedL1Count >= req.requiredCount) break;
          if (assignedToday.has(empId)) continue;

          // Absence check
          const isAbsent = approvedAbsences.some(abs => 
            abs.employee.toString() === empId && 
            currentDate >= abs.startDate && 
            currentDate <= abs.endDate
          );
          if (isAbsent) continue;

          // Night shift rest constraint
          if (isMorning) {
            const yesterdayShift = tracking.get(empId)?.[yesterdayStr];
            if (yesterdayShift === '21:00 - 05:00') continue;
          }

          const emp = employees.find(e => e._id.toString() === empId);
          if (emp) {
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
        }

        // Pass 2: Assign Level 3 (Training) ONLY IF a Level 1/2 is already assigned
        if (assignedL1Count > 0) {
          for (const empId of eligibleLevel3) {
            if (assignedL3Count >= 1) break; 
            if (assignedToday.has(empId)) continue;

            const isAbsent = approvedAbsences.some(abs => 
              abs.employee.toString() === empId && 
              currentDate >= abs.startDate && 
              currentDate <= abs.endDate
            );
            if (isAbsent) continue;

            if (isMorning) {
              const yesterdayShift = tracking.get(empId)?.[yesterdayStr];
              if (yesterdayShift === '21:00 - 05:00') continue;
            }

            const emp = employees.find(e => e._id.toString() === empId);
            if (emp) {
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
        }

        // Alert if critical requirement not met
        if (assignedL1Count < req.requiredCount) {
          console.warn(`[WARNING] Non è stato possibile coprire ${req.name} nel turno ${shiftTime} del ${dateStr} a causa di carenza personale o assenze.`);
        }
      }
    }
  }

  return scheduledShifts;
};

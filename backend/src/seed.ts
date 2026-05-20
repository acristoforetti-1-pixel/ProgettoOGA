import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee';
import Competence from './models/Competence';
import Workstation from './models/Workstation';
import User, { UserRole } from './models/User';
import ShiftAssignment from './models/ShiftAssignment';
import Absence, { AbsenceType, AbsenceStatus } from './models/Absence';
import connectDB from './config/db';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await Employee.deleteMany();
    await Competence.deleteMany();
    await User.deleteMany();
    await ShiftAssignment.deleteMany();
    await Absence.deleteMany();

    console.log('Database cleared (including Absences)!');

    const employeesData = [
      { employeeId: '901', firstName: 'Mario', lastName: 'Rossi', department: 'Converting', role: 'Assistente' },
      { employeeId: '902', firstName: 'Luca', lastName: 'Verdi', department: 'Converting', role: 'Conduttore' },
      { employeeId: '903', firstName: 'Giuseppe', lastName: 'Gialli', department: 'Converting', role: 'Assistente' },
      { employeeId: '904', firstName: 'Anna', lastName: 'Neri', department: 'Converting', role: 'Jolly' },
      { employeeId: '905', firstName: 'Paolo', lastName: 'Blu', department: 'Converting', role: 'Conduttore' },

      { employeeId: '801', firstName: 'Elena', lastName: 'Rosa', department: 'Coating', role: 'Analista' },
      { employeeId: '802', firstName: 'Stefano', lastName: 'Marroni', department: 'Coating', role: 'Conduttore' },
      { employeeId: '803', firstName: 'Laura', lastName: 'Viola', department: 'Coating', role: 'Analista' },
      { employeeId: '804', firstName: 'Roberto', lastName: 'Grigi', department: 'Coating', role: 'Jolly' },

      { employeeId: '701', firstName: 'Cristina', lastName: 'Bianchi', department: 'Logistica', role: 'Carrellista' },
      { employeeId: '702', firstName: 'Fabio', lastName: 'Azzurri', department: 'Logistica', role: 'Magazziniere' },
      { employeeId: '703', firstName: 'Sara', lastName: 'Arancio', department: 'Logistica', role: 'Carrellista' },

      { employeeId: '601', firstName: 'Claudio', lastName: 'Turchese', department: 'Qualità', role: 'CQ' },
      { employeeId: '602', firstName: 'Monica', lastName: 'Indaco', department: 'Qualità', role: 'CQ' },

      { employeeId: 'planner', firstName: 'Andrea', lastName: 'Planner', department: 'Management', role: 'Planner' },
    ];

    // Additional bulk employees to help testing coverage (many operator accounts)
    const bulkEmployees: any[] = [];
    const departments = ['Produzione', 'Converting', 'Coating', 'Logistica', 'Magazzino', 'Qualità'];
    let id = 1000;
    for (let i = 0; i < 300; i++) {
      id += 1;
      const empId = String(id);
      const dept = departments[i % departments.length];
      bulkEmployees.push({
        employeeId: empId,
        firstName: `Emp${empId}`,
        lastName: `Test${i + 1}`,
        department: dept,
        role: 'Operatore'
      });
    }

    // Merge lists
    const allEmployees = employeesData.concat(bulkEmployees);

    const createdEmployees = await Employee.insertMany(allEmployees);
    console.log(`${createdEmployees.length} Employees seeded!`);

    // Create Users for all
    const usersData = createdEmployees.map(emp => ({
      username: emp.employeeId === '901' ? 'mario' : emp.employeeId,
      password: 'password123',
      role: emp.role === 'Planner' ? UserRole.PLANNER : UserRole.OPERATOR,
      employee: emp._id
    }));

    await User.create(usersData);
    console.log('Users seeded!');

    // Competences (Mix of Levels)
    // Prefer using Workstation documents if present, otherwise fallback to a comprehensive list
    let wsDocs = await Workstation.find({});
    const fallbackWorkstations = [
      'SPM02 C','SPM02 SC','SPM02 AM','SPM02 TC','SPM02 SCS','SPM02 SCA','SPM03 C','SPM03 SC','SPM03 AM','SPM04 C','SPM04 SC','SPM04 AM','SPM04 TC','AUX','ASSISTENTE',
      'BOB 1.1','BOB 1.3','BOB 1.4','BOB 2.1','BOB 2.2','BOB 2.4','BOB 3.1','BOB 3.2','BOB 3.3','BOB 3.5','BOB 4.1','BOB 4.3','BOB 4.4','BOB 5.1','BOB 5.2','BOB 5.3','BOB 6.1','BOB 6.2',
      'RIB 01','RIB 02','RIBOBINATRICE','TAGL ANIME','TAGLIABUSTE','ASS.','RISME GIORNATA','PICKING','NAVETTAGGIO','MANIPOLATORE','TRASP.','JOLLY','CQ','ADE','PREPOSTO','CARR','SBOB','JUMBO','ANALISTA',
      'Cucina adesivi','MAN 1','MAN 2','MAN 3','MAN 4','MAN 5','FAS 1','FAS 2','FAS 3','FASCIATRICE','CARICO','RIBALTA','MAGAZ. CARREL.','Moto scopa','ABILITAZ. MULETTO','ABILITAZ. MULETTO CON PINZA'
    ];

    const workstationNames = (wsDocs && wsDocs.length > 0) ? wsDocs.map(w => w.name) : fallbackWorkstations;
    const competencesData: any[] = [];

    createdEmployees.forEach((emp, index) => {
      if (emp.role === 'Planner') return;

      // Assign 2-3 workstations to each (round-robin across available workstations)
      const numSkills = 2 + (index % 3);
      for (let i = 0; i < numSkills; i++) {
        const ws = workstationNames[(index + i) % workstationNames.length];
        competencesData.push({
          employee: emp._id,
          workstation: ws,
          level: (index % 2) + 1 // Level 1 or 2 (Autonomous)
        });
      }

      // Add a Level 3 (Training) to some
      if (index % 4 === 0) {
        competencesData.push({
          employee: emp._id,
          workstation: workstationNames[(index + 5) % workstationNames.length],
          level: 3
        });
      }
    });

    await Competence.insertMany(competencesData);
    console.log('Competences matrix seeded!');

    // Sample Absences
    const absencesData = [
      {
        employee: createdEmployees[0]._id,
        type: AbsenceType.FERIE,
        startDate: new Date('2026-05-15'),
        endDate: new Date('2026-05-17'),
        status: AbsenceStatus.APPROVED,
        reason: 'Vacanze famiglia'
      },
      {
        employee: createdEmployees[1]._id,
        type: AbsenceType.MALATTIA,
        startDate: new Date('2026-05-18'),
        endDate: new Date('2026-05-19'),
        status: AbsenceStatus.PENDING,
        reason: 'Influenza'
      },
      {
        employee: createdEmployees[5]._id,
        type: AbsenceType.L104,
        startDate: new Date('2026-05-15'),
        endDate: new Date('2026-05-15'),
        status: AbsenceStatus.APPROVED
      }
    ];

    await Absence.insertMany(absencesData);
    console.log('Sample Absences seeded!');

    process.exit();
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

seedData();

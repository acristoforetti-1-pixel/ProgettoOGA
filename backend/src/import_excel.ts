import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as xlsx from 'xlsx';
import Employee from './models/Employee';
import Competence from './models/Competence';
import connectDB from './config/db';

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    const workbook = xlsx.readFile('D:/TestProgettoOGA/DaAnalizzare.xlsx');
    const sheetName = 'QUALIFICATION MATRIX';
    const worksheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const headers = json[7]; // Row 7 is the header
    
    console.log('Importing employees and skills...');
    
    let importedCount = 0;
    
    for (let i = 8; i < json.length; i++) {
      const row = json[i];
      if (!row || row.length === 0) continue;
      
      const id = row[0];
      const reparto = row[1];
      const mansione = row[2];
      
      if (!id) continue; // Skip if no ID
      
      // Create or update employee
      const employeeId = id.toString();
      let employee = await Employee.findOne({ employeeId });
      
      if (!employee) {
        employee = new Employee({
          employeeId,
          firstName: 'Operatore',
          lastName: id.toString(),
          department: reparto || 'Sconosciuto',
          role: mansione || 'Sconosciuto',
          isActive: true
        });
        await employee.save();
      }
      
      // Parse skills
      for (let j = 3; j < row.length; j++) {
        const skillLevel = row[j];
        let skillName = headers[j];
        
        if (skillLevel && skillName) {
          // Clean up skill name (replace newlines with space)
          skillName = skillName.toString().replace(/\n/g, ' ').trim();
          
          const level = parseInt(skillLevel.toString());
          if (level >= 1 && level <= 4) {
            // Upsert competence
            await Competence.findOneAndUpdate(
              { employee: employee._id, workstation: skillName },
              { level },
              { upsert: true, new: true }
            );
          }
        }
      }
      
      importedCount++;
    }
    
    console.log(`Successfully imported/updated ${importedCount} employees and their skills.`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

importData();

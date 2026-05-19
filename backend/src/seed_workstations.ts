import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workstation from './models/Workstation';
import connectDB from './config/db';

dotenv.config();

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

const seedWorkstations = async () => {
  try {
    await connectDB();

    await Workstation.deleteMany({});
    
    const workstationsToInsert = dailyRequirements.map(req => ({
      name: req.name,
      defaultRequiredCount: req.requiredCount,
      skipsNight: req.skipsNight,
      isCritical: false
    }));

    await Workstation.insertMany(workstationsToInsert);
    console.log(`Successfully seeded ${workstationsToInsert.length} workstations.`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

seedWorkstations();

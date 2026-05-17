import * as xlsx from 'xlsx';

const analyzeExcel = () => {
  const workbook = xlsx.readFile('D:/TestProgettoOGA/DaAnalizzare.xlsx');
  
  console.log('--- SHEETS ---');
  console.log(workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Print first 10 rows to understand the structure
    console.log(json.slice(0, 15));
  }
};

analyzeExcel();

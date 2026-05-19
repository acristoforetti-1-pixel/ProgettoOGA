import * as xlsx from 'xlsx';

const analyzeExcel = () => {
  const workbook = xlsx.readFile('D:/TestProgettoOGA/DaAnalizzare.xlsx');
  const sheetName = 'QUALIFICATION MATRIX';
  const worksheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  console.log(`=== SHEET: ${sheetName} ===`);
  console.log(`Total rows: ${json.length}`);
  
  // Print rows 5 to 25 to see headers and first few data rows
  for (let i = 5; i <= 25; i++) {
    if (json[i]) {
      console.log(`Row ${i}:`, json[i]);
    }
  }
};

analyzeExcel();

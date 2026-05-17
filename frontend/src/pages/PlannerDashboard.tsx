import React, { useEffect, useState } from 'react';
import { Play, RotateCw } from 'lucide-react';
import { fetchEmployees, fetchShifts, generateSchedule } from '../api';
import type { Employee, Shift } from '../api';
import './Dashboard.css';

const PlannerDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, shiftData] = await Promise.all([fetchEmployees(), fetchShifts()]);
      setEmployees(empData);
      setShifts(shiftData);
    } catch (err) {
      console.error('Error fetching data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateSchedule('2026-05-15');
      await loadData(); // Reload grid
    } catch (err) {
      console.error('Error generating schedule', err);
    }
    setGenerating(false);
  };

  // Helper to get shift for a specific employee and day offset
  const getShiftForEmployeeAndDay = (empId: string, dayOffset: number) => {
    const targetDate = new Date('2026-05-15');
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateString = targetDate.toISOString().split('T')[0];

    if (!shifts || !Array.isArray(shifts)) return undefined;

    return shifts.find(s => {
      if (!s || !s.employee) return false;
      const sEmpId = typeof s.employee === 'string' ? s.employee : s.employee?._id;
      if (!sEmpId) return false;
      
      const sDate = typeof s.date === 'string' ? s.date : '';
      return sEmpId === empId && sDate.startsWith(dateString);
    });
  };
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gestione Planning</h1>
        <p className="page-subtitle">Reparto Produzione - Settimana 15 Maggio - 21 Maggio 2026</p>
      </div>

      <div className="planner-toolbar">
        <div className="planner-filters">
          <select className="form-control" style={{ width: '200px' }}>
            <option>Tutti i reparti</option>
            <option>Produzione</option>
            <option>Allestimento</option>
          </select>
        </div>
        <div className="planner-actions">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            <Play size={16} style={{ marginRight: '8px' }} />
            {generating ? 'Generazione...' : 'Genera Turni Settimana'}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="schedule-grid">
          <thead>
            <tr>
              <th>Operatore</th>
              <th>Ven 15</th>
              <th>Sab 16</th>
              <th>Dom 17</th>
              <th>Lun 18</th>
              <th>Mar 19</th>
              <th>Mer 20</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6">Caricamento dipendenti...</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id}>
                  <td>
                    <div className="cell-shift-name">{emp?.lastName || ''} {emp?.firstName?.charAt(0) || ''}.</div>
                    <div className="cell-shift-time">{emp?.employeeId || ''} - {emp?.role || ''}</div>
                  </td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 0)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 0)?.shiftTime || ''}</span></div></td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 1)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 1)?.shiftTime || ''}</span></div></td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 2)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 2)?.shiftTime || ''}</span></div></td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 3)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 3)?.shiftTime || ''}</span></div></td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 4)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 4)?.shiftTime || ''}</span></div></td>
                  <td><div className="cell-shift">{getShiftForEmployeeAndDay(emp._id, 5)?.workstation || '-'} <br/><span className="cell-shift-time">{getShiftForEmployeeAndDay(emp._id, 5)?.shiftTime || ''}</span></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlannerDashboard;

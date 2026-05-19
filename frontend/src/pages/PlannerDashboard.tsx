import React, { useEffect, useState } from 'react';
import { Play, Calendar as CalendarIcon } from 'lucide-react';
import { fetchEmployees, fetchShifts, generateSchedule, fetchWorkstations } from '../api';
import type { Employee, Shift, Workstation } from '../api';
import './Dashboard.css';

const PlannerDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-05-15'); // Default to match seed data
  const [selectedDepartment, setSelectedDepartment] = useState('Tutti');

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, shiftData, wsData] = await Promise.all([
        fetchEmployees(), 
        fetchShifts(),
        fetchWorkstations()
      ]);
      setEmployees(empData);
      setShifts(shiftData);
      setWorkstations(wsData);
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
      await generateSchedule(selectedDate);
      await loadData(); // Reload grid
    } catch (err) {
      console.error('Error generating schedule', err);
    }
    setGenerating(false);
  };

  // Helper to get shift for a specific employee and day offset
  const getShiftForEmployeeAndDay = (empId: string, dayOffset: number) => {
    const targetDate = new Date(selectedDate);
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

  // Helper to get uncovered workstations for a specific day offset
  const getUncoveredWorkstations = (dayOffset: number) => {
    const targetDate = new Date(selectedDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateString = targetDate.toISOString().split('T')[0];

    const uncovered: string[] = [];

    workstations.forEach(ws => {
      // For each shift time
      ['05:00 - 13:00', '13:00 - 21:00', '21:00 - 05:00'].forEach(shiftTime => {
        const isNight = shiftTime === '21:00 - 05:00';
        if (isNight && ws.skipsNight) return;

        const assignedCount = shifts.filter(s => {
          const sDate = typeof s.date === 'string' ? s.date : '';
          return s.workstation === ws.name && 
                 s.shiftTime === shiftTime && 
                 sDate.startsWith(dateString);
        }).length;

        if (assignedCount < ws.defaultRequiredCount) {
          uncovered.push(`${ws.name} (${shiftTime.split(' ')[0]})`); // Shorten time
        }
      });
    });

    return uncovered;
  };

  // Compute unique departments
  const departments = Array.from(new Set(employees.map(emp => emp.department))).filter(Boolean);

  // Generate day headers
  const getDayHeaders = () => {
    const headers = [];
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const baseDate = new Date(selectedDate);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dayName = daysOfWeek[d.getDay()];
      const dayNum = d.getDate();
      headers.push(`${dayName} ${dayNum}`);
    }
    return headers;
  };

  const dayHeaders = getDayHeaders();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gestione Planning</h1>
        <p className="page-subtitle">Settimana dal {new Date(selectedDate).toLocaleDateString()}</p>
      </div>

      <div className="planner-toolbar">
        <div className="planner-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="form-control" 
            style={{ width: '200px' }}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="Tutti">Tutti i reparti</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={16} />
            <input 
              type="date" 
              className="form-control" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '160px' }}
            />
          </div>
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
              {dayHeaders.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6">Caricamento...</td></tr>
            ) : (
              <>
                {/* Coverage Alert Row */}
                <tr style={{ background: '#fff3e0' }}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>Copertura</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Postazioni scoperte</div>
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                    const uncovered = getUncoveredWorkstations(dayOffset);
                    return (
                      <td key={dayOffset}>
                        {uncovered.length === 0 ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Coperto</span>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#c62828' }}>
                            {uncovered.map((u, i) => <div key={i}>{u}</div>)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Employees Rows */}
                {employees
                  .filter(emp => selectedDepartment === 'Tutti' || emp.department === selectedDepartment)
                  .filter(emp => emp.role !== 'Planner')
                  .map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div className="cell-shift-name">{emp?.lastName || ''} {emp?.firstName?.charAt(0) || ''}.</div>
                        <div className="cell-shift-time">{emp?.employeeId || ''} - {emp?.role || ''}</div>
                      </td>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                        const shift = getShiftForEmployeeAndDay(emp._id, dayOffset);
                        return (
                          <td key={dayOffset}>
                            <div className="cell-shift">
                              {shift?.workstation || '-'} <br/>
                              <span className="cell-shift-time">{shift?.shiftTime || ''}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlannerDashboard;

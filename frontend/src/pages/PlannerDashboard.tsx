import React, { useEffect, useState } from 'react';
import { Play, Calendar as CalendarIcon, Settings, Lock } from 'lucide-react';
import { fetchEmployees, fetchShifts, generateSchedule, fetchWorkstations, saveManualShift, fetchCompetences } from '../api';
import type { Employee, Shift, Workstation, Competence } from '../api';
import './Dashboard.css';

const PlannerDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-05-15'); // Default to match seed data
  const [selectedDepartment, setSelectedDepartment] = useState('Tutti');
  const [editingCell, setEditingCell] = useState<{ emp: Employee, date: string, existingShift?: Shift } | null>(null);
  const [modalData, setModalData] = useState<{ workstation: string, shiftTime: string, isLocked: boolean }>({ workstation: '', shiftTime: '05:00 - 13:00', isLocked: true });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, shiftData, wsData, compData] = await Promise.all([
        fetchEmployees(), 
        fetchShifts(),
        fetchWorkstations(),
        fetchCompetences()
      ]);
      setEmployees(empData);
      setShifts(shiftData);
      setWorkstations(wsData);
      setCompetences(compData);
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

  const openEditModal = (emp: Employee, dayOffset: number, existingShift?: Shift) => {
    const targetDate = new Date(selectedDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateString = targetDate.toISOString().split('T')[0];
    
    setEditingCell({ emp, date: dateString, existingShift });
    setModalData({
      workstation: existingShift?.workstation || workstations[0]?.name || '',
      shiftTime: existingShift?.shiftTime || '05:00 - 13:00',
      isLocked: existingShift?.isLocked !== undefined ? existingShift.isLocked : true
    });
  };

  const handleSaveManualShift = async (action: 'save' | 'delete') => {
    if (!editingCell) return;
    try {
      await saveManualShift({
        employeeId: editingCell.emp._id,
        date: editingCell.date,
        workstation: modalData.workstation,
        shiftTime: modalData.shiftTime,
        isLocked: modalData.isLocked,
        action: action === 'delete' ? 'delete' : undefined,
        weekStartDate: selectedDate
      });
      setEditingCell(null);
      await loadData();
    } catch (err) {
      console.error('Error saving manual shift', err);
    }
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
                          <td key={dayOffset} className="relative group" style={{ position: 'relative' }}>
                            <div className="cell-shift" style={{ minHeight: '40px', paddingRight: '20px' }}>
                              {shift?.workstation || '-'} <br/>
                              <span className="cell-shift-time">{shift?.shiftTime || ''}</span>
                              
                              {shift?.isLocked && (
                                <Lock size={12} style={{ position: 'absolute', bottom: '4px', left: '4px', color: '#d32f2f' }} />
                              )}
                              
                              <button 
                                className="btn-icon" 
                                style={{ position: 'absolute', top: '4px', right: '4px', opacity: 0, transition: 'opacity 0.2s', padding: '2px' }}
                                onClick={() => openEditModal(emp, dayOffset, shift)}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                              >
                                <Settings size={14} style={{ color: 'var(--color-primary)' }} />
                              </button>
                            </div>
                            {/* Workaround for group hover using CSS in inline style doesn't work well without classes, so we rely on parent hover if possible, but the button hover is easier: */}
                            {/* Actually, let's just make the button visible on hover of the td */}
                            <style>{`
                              td:hover .btn-icon {
                                opacity: 1 !important;
                              }
                            `}</style>
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

      {editingCell && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ padding: '2rem', width: '400px', backgroundColor: 'var(--color-bg, #ffffff)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-text, #333)' }}>Modifica Turno Manuale</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Operatore:</strong> {editingCell.emp.lastName} {editingCell.emp.firstName}
              <br/>
              <strong>Data:</strong> {new Date(editingCell.date).toLocaleDateString()}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Postazione</label>
              <select 
                className="form-control" 
                value={modalData.workstation} 
                onChange={e => setModalData({...modalData, workstation: e.target.value})}
              >
                {workstations
                  .filter(ws => {
                    const empId = editingCell?.emp._id;
                    if (!empId) return true;
                    // Find if employee has competence for this workstation
                    return competences.some(c => 
                      (typeof c.employee === 'string' ? c.employee : c.employee._id) === empId &&
                      c.workstation === ws.name
                    );
                  })
                  .map(ws => (
                  <option key={ws._id} value={ws.name}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Fascia Oraria</label>
              <select 
                className="form-control" 
                value={modalData.shiftTime} 
                onChange={e => setModalData({...modalData, shiftTime: e.target.value})}
              >
                <option value="05:00 - 13:00">05:00 - 13:00</option>
                <option value="13:00 - 21:00">13:00 - 21:00</option>
                <option value="21:00 - 05:00">21:00 - 05:00</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="isLocked" 
                checked={modalData.isLocked} 
                onChange={e => setModalData({...modalData, isLocked: e.target.checked})}
              />
              <label htmlFor="isLocked" style={{ marginBottom: 0, cursor: 'pointer' }}>Blocca Postazione (Fissa)</label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => handleSaveManualShift('delete')} style={{ color: '#d32f2f', borderColor: '#d32f2f', backgroundColor: 'transparent' }}>Rimuovi Turno</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setEditingCell(null)}>Annulla</button>
                <button className="btn btn-primary" onClick={() => handleSaveManualShift('save')}>Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlannerDashboard;

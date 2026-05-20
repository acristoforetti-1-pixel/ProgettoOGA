import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import { fetchCompetences, fetchWorkstations, updateCompetences } from '../api';
import type { Competence, Employee, Workstation } from '../api';
import './Dashboard.css';

const CompetenceMatrix: React.FC = () => {
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<{ employee: Employee, skills: Record<string, number> } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchCompetences(), fetchWorkstations()])
      .then(([compData, wsData]) => {
        setCompetences(compData);
        setWorkstations(wsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching competences or workstations', err);
        setLoading(false);
      });
  }, []);

  const handleSaveCompetences = async () => {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      await updateCompetences(editingEmployee.employee._id, editingEmployee.skills);
      const newComps = await fetchCompetences();
      setCompetences(newComps);
      setEditingEmployee(null);
    } catch (err) {
      console.error('Error saving competences', err);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Group competences by employee
  const employeeMap = new Map<string, { employee: Employee, skills: Record<string, number> }>();
  
  competences.forEach(comp => {
    if (!comp || !comp.employee || !comp.employee._id) return;
    
    if (!employeeMap.has(comp.employee._id)) {
      employeeMap.set(comp.employee._id, { employee: comp.employee, skills: {} });
    }
    employeeMap.get(comp.employee._id)!.skills[comp.workstation] = comp.level;
  });

  const rows = Array.from(employeeMap.values());

  // Column visibility and pagination
  const columnsPerPage = 8;

  const [currentPage, setCurrentPage] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});

  // Initialize visibleCols to true for all workstations
  useEffect(() => {
    const vis: Record<string, boolean> = {};
    workstations.forEach(ws => { vis[ws.name] = visibleCols[ws.name] ?? true; });
    setVisibleCols(vis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstations.length]);

  const visibleWorkstations = useMemo(() => workstations.filter(ws => visibleCols[ws.name] !== false), [workstations, visibleCols]);
  const totalPages = Math.max(1, Math.ceil(visibleWorkstations.length / columnsPerPage));
  const clampedPage = Math.min(currentPage, totalPages - 1);

  useEffect(() => { if (clampedPage !== currentPage) setCurrentPage(clampedPage); }, [clampedPage]);

  const pageStart = clampedPage * columnsPerPage;
  const pagedWorkstations = visibleWorkstations.slice(pageStart, pageStart + columnsPerPage);

  if (loading) return <div className="p-6">Caricamento competenze in corso...</div>;
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Matrice Competenze</h1>
        <p className="page-subtitle">Mappatura Skill Operative e HSE</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={clampedPage === 0}>←</button>
          <div>Pagina {clampedPage + 1} / {totalPages}</div>
          <button className="btn" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={clampedPage === totalPages - 1}>→</button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn" onClick={() => setPickerOpen(o => !o)}>Gestisci colonne</button>
            {pickerOpen && (
              <div className="column-picker">
                <div className="picker-header">
                  <strong>Seleziona colonne</strong>
                  <span className="picker-note">Mostra o nascondi i reparti visibili</span>
                </div>
                <div className="picker-actions">
                  <button className="btn small" onClick={() => { const next: Record<string, boolean> = {}; Object.keys(visibleCols).forEach(k => next[k] = true); setVisibleCols(next); }}>Mostra tutte</button>
                  <button className="btn small" onClick={() => { const next: Record<string, boolean> = {}; Object.keys(visibleCols).forEach(k => next[k] = false); setVisibleCols(next); }}>Nascondi tutte</button>
                </div>
                <div className="picker-list">
                  {workstations.map(ws => (
                    <label key={ws._id} className="picker-item">
                      <input type="checkbox" checked={visibleCols[ws.name] ?? true} onChange={e => setVisibleCols(prev => ({ ...prev, [ws.name]: e.target.checked }))} />
                      <span>{ws.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel matrix-container" style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table className="schedule-grid matrix-table">
          <thead>
            <tr>
              <th className="sticky-col">Operatore</th>
              {pagedWorkstations.map((ws) => (
                <th key={ws._id}>{ws.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee._id}>
                <td className="cell-shift-name sticky-col">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{row.employee.lastName} {row.employee.firstName.charAt(0)}.</span>
                    <button 
                      onClick={() => setEditingEmployee({ employee: row.employee, skills: { ...row.skills } })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex' }}
                      title="Modifica Competenze"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </td>
                {pagedWorkstations.map(ws => (
                  <td key={ws._id}><StatusBadge level={row.skills[ws.name] || 0} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEmployee && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '95%', maxWidth: '1200px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
              Modifica Competenze: {editingEmployee.employee.firstName} {editingEmployee.employee.lastName}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {workstations.map(ws => (
                <div key={ws._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{ws.name}</label>
                  <select 
                    value={editingEmployee.skills[ws.name] || 0}
                    onChange={e => setEditingEmployee(prev => prev ? { ...prev, skills: { ...prev.skills, [ws.name]: parseInt(e.target.value, 10) } } : prev)}
                    className="form-input"
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  >
                    <option value={0}>Non abilitato (-)</option>
                    <option value={1}>Abilitato</option>
                    <option value={2}>Addestrato</option>
                    <option value={3}>In Addestramento</option>
                    <option value={4}>Limitazioni</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)' }} onClick={() => setEditingEmployee(null)} disabled={saving}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSaveCompetences} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva Competenze'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ level: number }> = ({ level }) => {
  if (!level || level === 0) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
  
  let color = 'var(--color-text-primary)';
  let Icon = null;
  let text = '';
  
  if (level === 1) {
    color = 'var(--color-success)';
    Icon = CheckCircle;
    text = 'Abilitato';
  } else if (level === 2) {
    color = 'var(--color-success)';
    Icon = CheckCircle;
    text = 'Addestrato';
  } else if (level === 3) {
    color = 'var(--color-warning)';
    Icon = AlertCircle;
    text = 'In Addestramento';
  } else if (level === 4) {
    color = 'var(--color-accent)';
    Icon = XCircle;
    text = 'Limitazioni';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontWeight: 500, fontSize: '0.875rem' }}>
      {Icon && <Icon size={16} />}
      {text}
    </div>
  );
};

export default CompetenceMatrix;

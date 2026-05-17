import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchCompetences } from '../api';
import type { Competence, Employee } from '../api';
import './Dashboard.css';

const CompetenceMatrix: React.FC = () => {
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetences()
      .then((data) => {
        setCompetences(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching competences', err);
        setLoading(false);
      });
  }, []);

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

  if (loading) return <div className="p-6">Caricamento competenze in corso...</div>;
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Matrice Competenze</h1>
        <p className="page-subtitle">Reparto Produzione - Mappatura Skill Operative e HSE</p>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', marginTop: '2rem' }}>
        <table className="schedule-grid">
          <thead>
            <tr>
              <th>Operatore</th>
              <th>SPM02 C</th>
              <th>SPM02 SC</th>
              <th>BOB 1.1</th>
              <th>CARICO</th>
              <th>MULETTO</th>
              <th>RIB 01</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee._id}>
                <td className="cell-shift-name">{row.employee.lastName} {row.employee.firstName.charAt(0)}.</td>
                <td><StatusBadge level={row.skills['SPM02 C'] || 0} /></td>
                <td><StatusBadge level={row.skills['SPM02 SC'] || 0} /></td>
                <td><StatusBadge level={row.skills['BOB 1.1'] || 0} /></td>
                <td><StatusBadge level={row.skills['CARICO'] || 0} /></td>
                <td><StatusBadge level={row.skills['ABILITAZ. MULETTO'] || 0} /></td>
                <td><StatusBadge level={row.skills['RIB 01'] || 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

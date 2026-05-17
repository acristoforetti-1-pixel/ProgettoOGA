import React, { useEffect, useState } from 'react';
import { fetchShifts, fetchAbsences, createAbsence } from '../api';
import type { Shift, Employee } from '../api';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';

const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [myAbsences, setMyAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [absType, setAbsType] = useState('FERIE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Use real logged in employee ID from context
  const loggedInEmployeeId = user?.employeeId;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchShifts(),
      fetchAbsences()
    ]).then(([shiftData, absData]) => {
      // Filter shifts
      const myShifts = shiftData.filter(s => {
        const emp = s.employee as Employee;
        return emp?.employeeId === loggedInEmployeeId;
      });
      myShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setShifts(myShifts);

      // Filter absences
      const myAbs = absData.filter((a: any) => a.employee?.employeeId === loggedInEmployeeId);
      setMyAbsences(myAbs);
      
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert('Seleziona le date');
    
    setSubmitting(true);
    try {
      await createAbsence({
        employeeId: loggedInEmployeeId,
        type: absType,
        startDate,
        endDate
      });
      alert('Richiesta inviata con successo');
      loadData();
    } catch (err) {
      console.error('Error sending request', err);
      alert('Errore nell\'invio della richiesta');
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return `${days[d.getDay()]} ${d.getDate()}`;
  };
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">I Miei Turni</h1>
        <p className="page-subtitle">Settimana 14 Maggio - 20 Maggio 2026</p>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel p-6 span-2">
          <h2 className="section-title">Prossimi Turni</h2>
          <div className="shift-list">
            {loading ? (
              <div className="p-6">Caricamento turni...</div>
            ) : shifts.length === 0 ? (
              <div className="p-6">Nessun turno assegnato per questa settimana. Prova a cliccare "Genera Turni Settimana" dal pannello Planner.</div>
            ) : (
              shifts.map((shift) => (
                <div key={shift._id} className="shift-card">
                  <div className="shift-date">{formatDate(shift.date)}</div>
                  <div className="shift-details">
                    <span className="shift-time">{shift.shiftTime}</span>
                    <span className="shift-role">{shift.workstation}</span>
                  </div>
                  <div className={`shift-status status-confermato`}>
                    CONFERMATO
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="section-title" style={{ marginTop: '3rem' }}>Le Mie Richieste</h2>
          <div className="absence-list">
            {myAbsences.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Nessuna richiesta inviata.</p>
            ) : (
              <table className="schedule-grid" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Dal</th>
                    <th>Al</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {myAbsences.map((abs: any) => (
                    <tr key={abs._id}>
                      <td>{abs.type}</td>
                      <td>{new Date(abs.startDate).toLocaleDateString()}</td>
                      <td>{new Date(abs.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-${abs.status.toLowerCase()}`} style={{ fontWeight: 700 }}>
                          {abs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="section-title">Richieste</h2>
          <form className="request-form" onSubmit={handleSubmitRequest}>
            <div className="form-group">
              <label className="form-label">Tipo Assenza</label>
              <select className="form-control" value={absType} onChange={e => setAbsType(e.target.value)}>
                <option value="FERIE">Ferie</option>
                <option value="PERMESSO">Permesso (ROL)</option>
                <option value="MALATTIA">Malattia</option>
                <option value="104">Legge 104</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dal</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Al</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Invio in corso...' : 'Invia Richiesta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;

import React, { useEffect, useState } from 'react';
import { fetchAbsences, createAbsence } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const OperatorRequests: React.FC = () => {
  const { user } = useAuth();
  const [myAbsences, setMyAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [absType, setAbsType] = useState('FERIE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loggedInEmployeeId = user?.employeeId;

  const loadData = () => {
    setLoading(true);
    fetchAbsences().then((absData: any[]) => {
      const myAbs = absData.filter(a => a.employee?.employeeId === loggedInEmployeeId);
      setMyAbsences(myAbs);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching absences', err);
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
        endDate,
      });
      alert('Richiesta inviata con successo');
      loadData();
    } catch (err) {
      console.error('Error sending request', err);
      alert('Errore nell\'invio della richiesta');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Richieste</h1>
        <p className="page-subtitle">Invia nuove richieste o consulta lo stato delle tue richieste</p>
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

      <div className="glass-panel p-6" style={{ marginTop: '1.5rem' }}>
        <h2 className="section-title">Le Mie Richieste</h2>
        {loading ? (
          <div className="p-6">Caricamento richieste...</div>
        ) : myAbsences.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Nessuna richiesta inviata.</p>
        ) : (
          <table className="schedule-grid" style={{ fontSize: '0.9rem' }}>
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
  );
};

export default OperatorRequests;

import React, { useEffect, useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { fetchAbsences, updateAbsenceStatus } from '../api';
import './Dashboard.css';

const AbsenceManager: React.FC = () => {
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const data = await fetchAbsences();
      // Sort: Pending first, then by date
      const sorted = data.sort((a: any, b: any) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
      setAbsences(sorted);
    } catch (err) {
      console.error('Error fetching absences', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAbsences();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateAbsenceStatus(id, status);
      loadAbsences();
    } catch (err) {
      console.error('Error updating status', err);
      alert('Errore nell\'aggiornamento dello stato');
    }
  };

  if (loading) return <div className="p-6">Caricamento richieste...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gestione Assenze</h1>
        <p className="page-subtitle">Approvazione ferie e monitoraggio copertura produttiva</p>
      </div>

      <div className="glass-panel p-6">
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff9c4', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #fbc02d' }}>
          <AlertTriangle color="#fbc02d" size={24} />
          <div>
            <strong style={{ display: 'block' }}>Monitoraggio Produzione</strong>
            <span style={{ fontSize: '0.85rem' }}>Attenzione: Approvare troppe ferie contemporaneamente per lo stesso reparto potrebbe impedire la copertura delle macchine critiche.</span>
          </div>
        </div>

        <table className="schedule-grid">
          <thead>
            <tr>
              <th>Dipendente</th>
              <th>Tipo</th>
              <th>Periodo</th>
              <th>Motivazione</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {absences.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nessuna richiesta presente.</td></tr>
            ) : (
              absences.map((abs) => (
                <tr key={abs._id}>
                  <td className="cell-shift-name">
                    {abs.employee?.lastName} {abs.employee?.firstName}
                  </td>
                  <td>{abs.type}</td>
                  <td>
                    {new Date(abs.startDate).toLocaleDateString()} - {new Date(abs.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {abs.reason || '-'}
                  </td>
                  <td>
                    <span className={`status-${abs.status.toLowerCase()}`} style={{ fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                      {abs.status}
                    </span>
                  </td>
                  <td>
                    {abs.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem', background: '#2e7d32' }}
                          onClick={() => handleStatusUpdate(abs._id, 'APPROVED')}
                          title="Approva"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem', background: '#c62828' }}
                          onClick={() => handleStatusUpdate(abs._id, 'REJECTED')}
                          title="Rifiuta"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbsenceManager;

import React, { useEffect, useState } from 'react';
import { fetchShifts } from '../api';
import type { Shift, Employee } from '../api';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';

const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Use real logged in employee ID from context
  const loggedInEmployeeId = user?.employeeId;

  const loadData = () => {
    setLoading(true);
    fetchShifts().then((shiftData) => {
      // Filter shifts
      const myShifts = shiftData.filter(s => {
        const emp = s.employee as Employee;
        return emp?.employeeId === loggedInEmployeeId;
      });
      myShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setShifts(myShifts);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  

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

          {/* Requests moved to separate page */}
        </div>

        
      </div>
    </div>
  );
};

export default OperatorDashboard;

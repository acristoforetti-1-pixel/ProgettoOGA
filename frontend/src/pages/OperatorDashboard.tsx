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

  const getWeekRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const formatItalianDate = (date: Date, includeYear = false) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    if (includeYear) options.year = 'numeric';
    const formatted = date.toLocaleDateString('it-IT', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const weekRange = getWeekRange();
  const weekLabel = `${formatItalianDate(weekRange.start)} - ${formatItalianDate(weekRange.end, true)}`;

  const isInWeekRange = (dateString: string) => {
    const d = new Date(dateString);
    return d >= weekRange.start && d <= weekRange.end;
  };

  const loadData = () => {
    if (!loggedInEmployeeId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchShifts().then((shiftData) => {
      // Filter shifts for logged-in user inside the current week range
      const myShifts = shiftData.filter(s => {
        const emp = s.employee as Employee;
        return emp?.employeeId === loggedInEmployeeId && isInWeekRange(s.date);
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
  }, [loggedInEmployeeId]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return `${days[d.getDay()]} ${d.getDate()}`;
  };
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">I Miei Turni</h1>
        <p className="page-subtitle">Settimana {weekLabel}</p>
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

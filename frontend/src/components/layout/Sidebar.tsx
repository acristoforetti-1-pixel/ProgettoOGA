import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Activity, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="layout-sidebar">
      <div className="sidebar-logo">
        <h1>OGA Shift</h1>
      </div>
      <nav className="sidebar-nav">
        {/* Workers only */}
        {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
          <NavLink to="/operator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>I Miei Turni</span>
          </NavLink>
        )}

        {/* Planners only */}
        {(user?.role === 'PLANNER' || user?.role === 'ADMIN') && (
          <>
            <NavLink to="/planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Activity size={20} />
              <span>Gestione Planning</span>
            </NavLink>
            <NavLink to="/competences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} />
              <span>Matrice Competenze</span>
            </NavLink>
            <NavLink to="/absences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Gestione Assenze</span>
            </NavLink>
          </>
        )}
        
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={logout}
            className="nav-item" 
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

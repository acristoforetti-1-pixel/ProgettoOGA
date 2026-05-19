import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`layout-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar onNavigate={closeSidebar} />
      <div className="layout-content">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="layout-main" onClick={closeSidebar}>
          <Outlet />
        </main>
      </div>

      {/* overlay for mobile when sidebar is open */}
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
    </div>
  );
};

export default MainLayout;

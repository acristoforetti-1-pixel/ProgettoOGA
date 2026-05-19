import React from 'react';
import { useAuth } from '../../context/AuthContext';

type HeaderProps = {
  onToggleSidebar?: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="layout-header">
      <button
        className="mobile-menu-btn"
        aria-label="Apri menu"
        onClick={onToggleSidebar}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <div className="header-user">
        <div className="user-info">
          <span className="user-name">{user.firstName} {user.lastName}</span>
          <span className="user-role">{user.role}</span>
        </div>
        <div className="user-avatar">
          {user.firstName.charAt(0)}{user.lastName.charAt(0) || user.username.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;

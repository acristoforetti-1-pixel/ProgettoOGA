import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="layout-header">
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

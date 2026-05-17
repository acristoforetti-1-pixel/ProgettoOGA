import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import PlannerDashboard from './pages/PlannerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import CompetenceMatrix from './pages/CompetenceMatrix';
import AbsenceManager from './pages/AbsenceManager';
import Login from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Caricamento...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to={user?.role === 'OPERATOR' ? '/operator' : '/planner'} />} />
        <Route path="operator" element={<OperatorDashboard />} />
        
        {/* Planner/Admin only routes */}
        <Route path="planner" element={
          <ProtectedRoute roles={['PLANNER', 'ADMIN']}><PlannerDashboard /></ProtectedRoute>
        } />
        <Route path="competences" element={
          <ProtectedRoute roles={['PLANNER', 'ADMIN']}><CompetenceMatrix /></ProtectedRoute>
        } />
        <Route path="absences" element={
          <ProtectedRoute roles={['PLANNER', 'ADMIN']}><AbsenceManager /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

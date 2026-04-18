import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role to uppercase just in case
  const role = String(user.role || '').replace('ROLE_', '').toUpperCase();

  switch (role) {
    case 'ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'DOCTOR':
      return <Navigate to="/dashboard/doctor" replace />;
    case 'PATIENT':
    default:
      return <Navigate to="/dashboard/patient" replace />;
  }
};

export default RoleBasedRedirect;

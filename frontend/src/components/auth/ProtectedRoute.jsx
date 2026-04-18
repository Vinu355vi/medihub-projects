import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    // For demo/development, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

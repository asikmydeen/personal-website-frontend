import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '@core/store/useStore';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const location = useLocation();

  // More strict authentication check
  if (!isAuthenticated || !user) {
    // Redirect to login and remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;

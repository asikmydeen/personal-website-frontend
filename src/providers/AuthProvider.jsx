import React, { useEffect, useState } from 'react';
import useStore from '@core/store/useStore';
import authService from '@core/services/authService';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useStore(state => state.setUser);
  const removeUser = useStore(state => state.removeUser);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    async function checkAuthStatus() {
      const token = await authService.getToken();
      if (token) {
        try {
          const { data } = await authService.verifyToken();
          setUser(data.user);
        } catch {
          removeUser();
        }
      } else {
        removeUser();
      }
      setIsLoading(false);
    }
    checkAuthStatus();
  }, []);

  if (isLoading) {
    // You could show a loading spinner here
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-playful-button-primary-background"></div>
      </div>
    );
  }

  return children;
};

export default AuthProvider;

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
    const checkAuthStatus = async () => {
      try {
        // Check if there's a token
        const token = await authService.getToken();
        
        if (token) {
          try {
            // Verify the token and get user data
            const response = await authService.verifyToken();
            if (response && response.success && response.data && response.data.user) {
              // Set the user in the store
              setUser(response.data.user);
            } else {
              // Token verification failed, clear the token
              await authService.logout();
              removeUser();
              // Redirect to login if not already there
              if (location.pathname !== '/login' &&
                  location.pathname !== '/register' &&
                  location.pathname !== '/forgot-password') {
                navigate('/login');
              }
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            // Clear the token on error
            await authService.logout();
            removeUser();
            // Redirect to login if not already there
            if (location.pathname !== '/login' &&
                location.pathname !== '/register' &&
                location.pathname !== '/forgot-password') {
              navigate('/login');
            }
          }
        } else {
          // No token found, ensure user is removed from store
          removeUser();
          // Redirect to login if not already there
          if (location.pathname !== '/login' &&
              location.pathname !== '/register' &&
              location.pathname !== '/forgot-password') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        removeUser();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [setUser, removeUser, navigate, location.pathname]);

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
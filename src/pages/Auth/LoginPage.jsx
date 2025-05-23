import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '@core/store/useStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useStore(state => state.login);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  
  // If user is already authenticated, redirect to home or the page they were trying to access
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login({ email, password });
      console.log('Login response:', response);
      
      // Check if the response has the expected structure
      if (response && response.success && response.data && response.data.user) {
        // Redirect to the page they were trying to access or home
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else {
        console.error('Unexpected response structure:', response);
        setError(response?.error || 'Login failed: Unexpected response structure');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-playful-page-background text-playful-content-text-color px-4 py-6 sm:py-0 sm:px-0">
      <div className="bg-playful-card-background p-5 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md border border-playful-card-border-color">
        <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-8 text-center text-playful-button-primary-background">Welcome Back, Superstar! ✨</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label htmlFor="email" className="block text-sm sm:text-md font-medium text-playful-content-text-color mb-1 sm:mb-2">Your Magical Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border border-playful-card-border-color rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-playful-focus-ring-color focus:border-playful-focus-ring-color text-sm bg-playful-input-background placeholder-playful-input-placeholder-color text-playful-content-text-color"
              placeholder="you@awesometown.com"
            />
          </div>
          <div className="mb-5 sm:mb-8">
            <label htmlFor="password" className="block text-sm sm:text-md font-medium text-playful-content-text-color mb-1 sm:mb-2">Your Secret Code</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border border-playful-card-border-color rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-playful-focus-ring-color focus:border-playful-focus-ring-color text-sm bg-playful-input-background placeholder-playful-input-placeholder-color text-playful-content-text-color"
              placeholder="•••••••• (shhh!)"
            />
          </div>
          {error && <p className="text-red-500 text-xs sm:text-sm mb-4 sm:mb-6 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-playful-button-primary-background text-playful-button-primary-text-color py-2 sm:py-3 px-4 rounded-lg hover:bg-playful-button-primary-hover-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-playful-focus-ring-color disabled:opacity-60 transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold text-base sm:text-lg"
          >
            {loading ? 'Unlocking the Fun...' : "Let's Go! 🚀"}
          </button>
        </form>
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-playful-content-text-color/80">
          New to the Fun Zone?{' '}
          <a href="/register" className="font-medium text-playful-link-text-color hover:text-playful-link-hover-text-color underline">
            Join the Party!
          </a>
        </p>
        <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-playful-content-text-color/80">
          <a href="/forgot-password" className="font-medium text-playful-link-text-color hover:text-playful-link-hover-text-color underline">
            Oops, Forgot My Code!
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

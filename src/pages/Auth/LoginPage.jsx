import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login({ email, password });
      if (response.success) {
        navigate('/'); // Redirect to dashboard or home page
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-playful-page-background text-playful-content-text-color">
      <div className="bg-playful-card-background p-8 rounded-lg shadow-xl w-full max-w-md border border-playful-card-border-color">
        <h2 className="text-3xl font-bold mb-8 text-center text-playful-button-primary-background">Welcome Back, Superstar! ✨</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-md font-medium text-playful-content-text-color mb-2">Your Magical Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-playful-card-border-color rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-playful-focus-ring-color focus:border-playful-focus-ring-color sm:text-sm bg-playful-input-background placeholder-playful-input-placeholder-color text-playful-content-text-color"
              placeholder="you@awesometown.com"
            />
          </div>
          <div className="mb-8">
            <label htmlFor="password" className="block text-md font-medium text-playful-content-text-color mb-2">Your Secret Code</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-playful-card-border-color rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-playful-focus-ring-color focus:border-playful-focus-ring-color sm:text-sm bg-playful-input-background placeholder-playful-input-placeholder-color text-playful-content-text-color"
              placeholder="•••••••• (shhh!)"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-6 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-playful-button-primary-background text-playful-button-primary-text-color py-3 px-4 rounded-lg hover:bg-playful-button-primary-hover-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-playful-focus-ring-color disabled:opacity-60 transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold text-lg"
          >
            {loading ? 'Unlocking the Fun...' : "Let's Go! 🚀"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-playful-content-text-color/80">
          New to the Fun Zone?{' '}
          <a href="/register" className="font-medium text-playful-link-text-color hover:text-playful-link-hover-text-color underline">
            Join the Party!
          </a>
        </p>
        <p className="mt-3 text-center text-sm text-playful-content-text-color/80">
          <a href="/forgot-password" className="font-medium text-playful-link-text-color hover:text-playful-link-hover-text-color underline">
            Oops, Forgot My Code!
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

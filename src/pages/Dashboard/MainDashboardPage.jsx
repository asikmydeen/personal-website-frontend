import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// Placeholder: Import services to fetch counts or recent items for dashboard widgets
// import { getPhotoCount, getRecentPhotos } from '../../services/photoService';
// import { getFileCount } from '../../services/fileService';
// import { getNoteCount } from '../../services/notesService';
// import { getBookmarkCount } from '../../services/bookmarkService';
// import { getPasswordCount } from '../../services/passwordService';
// import { getCardCount } from '../../services/digitalWalletService';
// import { getVoiceMemoCount } from '../../services/voiceMemoService';

// Placeholder data structure for dashboard items
const initialDashboardStats = {
  photos: { count: 0, recent: [] },
  files: { count: 0 },
  notes: { count: 0 },
  bookmarks: { count: 0 },
  passwords: { count: 0 },
  cards: { count: 0 },
  voiceMemos: { count: 0 },
  // Add more stats as needed
};

const DashboardWidget = ({ title, count, linkTo, icon, recentItems }) => {
  return (
    <Link to={linkTo} className="block bg-playful-card-background shadow-xl rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1 border border-playful-card-border-color hover:border-playful-focus-ring-color">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-playful-content-text-color">{title}</h3>
        {icon && <div className="text-2xl text-playful-link-text-color">{icon}</div>}
      </div>
      <p className="text-4xl font-bold text-playful-button-primary-background mb-2">{count}</p>
      {recentItems && recentItems.length > 0 && (
        <div>
          <p className="text-xs text-playful-content-text-color/70 mb-1">Recently Added:</p>
          <ul className="text-xs text-playful-content-text-color/80 space-y-0.5">
            {recentItems.slice(0, 3).map((item, index) => (
              <li key={index} className="truncate">- {item.name || 'Untitled'}</li>
            ))}
          </ul>
        </div>
      )}
      {!recentItems && <p className="text-sm text-playful-content-text-color/60">Manage your {title.toLowerCase()}.</p>}
      {recentItems && recentItems.length === 0 && <p className="text-sm text-playful-content-text-color/60">No recent {title.toLowerCase()} yet.</p>}
    </Link>
  );
};

const MainDashboardPage = () => {
  const [stats, setStats] = useState(initialDashboardStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('User'); // Placeholder, fetch from auth context/service

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Placeholder: Simulate fetching data from various services
      // In a real app, these would be actual API calls
      // const photoData = await getPhotoCount(); // and getRecentPhotos()
      // const fileData = await getFileCount();
      // ... and so on for other services

      // Simulate API responses
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      const fetchedStats = {
        photos: { count: 125, recent: [{ name: 'Vacation Pic 1' }, { name: 'Family Gathering' }] },
        files: { count: 42 },
        notes: { count: 18 },
        bookmarks: { count: 73 },
        passwords: { count: 35 },
        cards: { count: 3 },
        voiceMemos: { count: 7 },
      };
      setStats(fetchedStats);

      // Fetch user name (placeholder)
      // const userProfile = await getUserProfile();
      // if (userProfile.success) setUserName(userProfile.data.name || 'User');

    } catch (err) {
      setError('Failed to load dashboard data. Some widgets may not display correctly.');
      console.error('Dashboard fetch error:', err);
      setStats(initialDashboardStats); // Reset to initial on error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Placeholder icons (using simple text/emoji for now, replace with actual icons e.g., from Lucide)
  const icons = {
    photos: '📷',
    files: '📁',
    notes: '📝',
    bookmarks: '🔖',
    passwords: '🔑',
    cards: '💳',
    voiceMemos: '🎤',
  };

  if (loading) {
    return <div className="p-8 text-center text-xl text-playful-content-text-color">Loading your dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-playful-content-text-color mb-2">Welcome back, {userName}!</h1>
      <p className="text-md text-playful-content-text-color/80 mb-8">Here's an overview of your personal space.</p>

      {error && <div className="mb-6 p-4 bg-red-500/10 text-red-700/90 border border-red-500/30 rounded-lg shadow">Error: {error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <DashboardWidget
          title="Photos"
          count={stats.photos.count}
          linkTo="/photos"
          icon={icons.photos}
          recentItems={stats.photos.recent}
        />
        <DashboardWidget
          title="Files"
          count={stats.files.count}
          linkTo="/files"
          icon={icons.files}
        />
        <DashboardWidget
          title="Notes"
          count={stats.notes.count}
          linkTo="/notes"
          icon={icons.notes}
        />
        <DashboardWidget
          title="Bookmarks"
          count={stats.bookmarks.count}
          linkTo="/bookmarks"
          icon={icons.bookmarks}
        />
        <DashboardWidget
          title="Passwords"
          count={stats.passwords.count}
          linkTo="/passwords"
          icon={icons.passwords}
        />
        <DashboardWidget
          title="Wallet"
          count={stats.cards.count}
          linkTo="/wallet"
          icon={icons.cards}
        />
        <DashboardWidget
          title="Voice Memos"
          count={stats.voiceMemos.count}
          linkTo="/voice-memos"
          icon={icons.voiceMemos}
        />
        {/* Add more widgets as needed */}
        {/* Example for a settings link or profile */}
        <Link to="/profile" className="block bg-playful-card-background shadow-xl rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1 border border-playful-card-border-color hover:border-playful-focus-ring-color flex flex-col items-center justify-center text-center">

          <div className="text-3xl mb-2 text-playful-link-text-color">⚙️</div>
          <h3 className="text-xl font-semibold text-playful-content-text-color">Settings</h3>
          <p className="text-sm text-playful-content-text-color/70">Manage your profile & preferences</p>
        </Link>
      </div>
    </div> // Closing tag for the main container div
  );
};

export default MainDashboardPage;

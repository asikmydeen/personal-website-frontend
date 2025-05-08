import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listPhotos } from '../../services/photoService';
import { listDirectoryContents } from '../../services/fileService';
import { listNotes } from '../../services/notesService';
import { listCards } from '../../services/digitalWalletService';
import { listVoiceMemos } from '../../services/voiceMemoService';
import { get } from '../../services/apiService';
import useStore from '../../store/useStore';

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

  const user = useStore(state => state.user);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch data from various services in parallel
      const [photosResponse, filesResponse, notesResponse, bookmarksResponse, passwordsResponse, cardsResponse, voiceMemosResponse, resumeResponse] = await Promise.all([
        listPhotos(),
        listDirectoryContents(),
        listNotes(),
        get('bookmarks'),
        get('passwords'),
        listCards(),
        listVoiceMemos(),
        get('resume')
      ]);

      // Process photos data
      const photosData = photosResponse.success ? {
        count: photosResponse.data.length || 0,
        recent: photosResponse.data?.slice(0, 3).map(photo => ({
          name: photo.title || photo.name || 'Unnamed Photo',
          id: photo.id
        })) || []
      } : { count: 0, recent: [] };

      // Process files data
      const filesData = filesResponse.success ? {
        count: filesResponse.data?.items?.length || 0,
        recent: filesResponse.data?.items?.slice(0, 3).map(file => ({
          name: file.name || 'Unnamed File',
          id: file.id
        })) || []
      } : { count: 0, recent: [] };

      // Process notes data
      const notesData = notesResponse.success ? {
        count: notesResponse.data?.length || 0,
        recent: notesResponse.data?.slice(0, 3).map(note => ({
          name: note.title || 'Unnamed Note',
          id: note.id
        })) || []
      } : { count: 0, recent: [] };

      // Process bookmarks data
      const bookmarksData = bookmarksResponse.success ? {
        count: bookmarksResponse.data?.length || 0,
        recent: bookmarksResponse.data?.slice(0, 3).map(bookmark => ({
          name: bookmark.title || bookmark.url || 'Unnamed Bookmark',
          id: bookmark.id
        })) || []
      } : { count: 0, recent: [] };

      // Process passwords data
      const passwordsData = passwordsResponse.success ? {
        count: passwordsResponse.data?.length || 0
      } : { count: 0 };

      // Process wallet cards data
      const cardsData = cardsResponse.success ? {
        count: cardsResponse.data?.cards?.length || 0,
        recent: cardsResponse.data?.cards?.slice(0, 3).map(card => ({
          name: card.name || `${card.cardType || card.issuer || ''} Card`,
          id: card.id
        })) || []
      } : { count: 0, recent: [] };

      // Process voice memos data
      const voiceMemosData = voiceMemosResponse.success ? {
        count: voiceMemosResponse.data?.memos?.length || 0,
        recent: voiceMemosResponse.data?.memos?.slice(0, 3).map(memo => ({
          name: memo.title || 'Unnamed Voice Memo',
          id: memo.id
        })) || []
      } : { count: 0, recent: [] };

      // Process resume data
      const resumeData = resumeResponse.success ? {
        count: resumeResponse.data?.length || 0,
        recent: resumeResponse.data?.slice(0, 1).map(resume => ({
          name: resume.title || 'Resume',
          id: resume.id
        })) || []
      } : { count: 0, recent: [] };

      const fetchedStats = {
        photos: photosData,
        files: filesData,
        notes: notesData,
        bookmarks: bookmarksData,
        passwords: passwordsData,
        cards: cardsData,
        voiceMemos: voiceMemosData,
        resume: resumeData
      };

      setStats(fetchedStats);

      // Set user name if available
      if (user) {
        setUserName(user.name || 'User');
      }

    } catch (err) {
      setError('Failed to load dashboard data. Some widgets may not display correctly.');
      console.error('Dashboard fetch error:', err);
      setStats(initialDashboardStats); // Reset to initial on error
    }
    setLoading(false);
  }, [user]);

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
          recentItems={stats.files.recent}
        />
        <DashboardWidget
          title="Notes"
          count={stats.notes.count}
          linkTo="/notes"
          icon={icons.notes}
          recentItems={stats.notes.recent}
        />
        <DashboardWidget
          title="Bookmarks"
          count={stats.bookmarks.count}
          linkTo="/bookmarks"
          icon={icons.bookmarks}
          recentItems={stats.bookmarks.recent}
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
          recentItems={stats.cards.recent}
        />
        <DashboardWidget
          title="Voice Memos"
          count={stats.voiceMemos.count}
          linkTo="/voice-memos"
          icon={icons.voiceMemos}
          recentItems={stats.voiceMemos.recent}
        />
        <DashboardWidget
          title="Resume"
          count={stats.resume ? stats.resume.count : 0}
          linkTo="/resume"
          icon="📄"
          recentItems={stats.resume ? stats.resume.recent : []}
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

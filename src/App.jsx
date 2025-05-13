import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import ThemeProvider from './providers/ThemeProvider';

import MainDashboardPage from './pages/Dashboard/MainDashboardPage';
import PhotoGalleryPage from './pages/Photos/PhotoGalleryPage';
import FileManagerPage from './pages/Files/FileManagerPage';
import ResumeViewPage from './pages/Resume/ResumeViewPage';
import ResumeEditPage from './pages/Resume/ResumeEditPage';
import ResumeListPage from './pages/Resume/ResumeListPage';
import LoginPage from './pages/Auth/LoginPage';
import NotesListPage from './pages/Notes/NotesListPage';
import TextNoteViewPage from './pages/Notes/TextNoteViewPage';
import BookmarkManagerPage from './pages/Bookmarks/BookmarkManagerPage';
import PasswordListPage from './pages/Passwords/PasswordListPage';
import WalletDashboardPage from './pages/Wallet/WalletDashboardPage';
import VoiceMemoListPage from './pages/VoiceMemos/VoiceMemoListPage';
import UserProfilePage from './pages/User/UserProfilePage';
import 'antd/dist/reset.css';
import './styles/antd-dark-overrides.css';

// Photo components
import PhotoDetailViewComponent from './components/photos/PhotoDetailViewComponent';
import AlbumViewComponent from './components/photos/AlbumViewComponent';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/login"
              element={<LoginPage />}
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainDashboardPage />
                </PrivateRoute>
              }
            />
          <Route
            path="/photos"
            element={
              <PrivateRoute>
                <PhotoGalleryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/photos/album/:albumId"
            element={
              <PrivateRoute>
                <AlbumViewComponent />
              </PrivateRoute>
            }
          />
          <Route
            path="/photos/:photoId"
            element={
              <PrivateRoute>
                <PhotoDetailViewComponent />
              </PrivateRoute>
            }
          />
          <Route
            path="/files"
            element={
              <PrivateRoute>
                <FileManagerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <PrivateRoute>
                <ResumeListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/resume/:resumeId"
            element={
              <PrivateRoute>
                <ResumeViewPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/resume/edit/:resumeId"
            element={
              <PrivateRoute>
                <ResumeEditPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <PrivateRoute>
                <NotesListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notes/:noteId"
            element={
              <PrivateRoute>
                <TextNoteViewPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <PrivateRoute>
                <BookmarkManagerPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/passwords"
            element={
              <PrivateRoute>
                <PasswordListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <WalletDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/voice-memos"
            element={
              <PrivateRoute>
                <VoiceMemoListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            }
          />
          {/* Add more routes here for other features */}
        </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

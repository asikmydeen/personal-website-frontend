import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { isNativePlatform } from './core/platform';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import ThemeProvider from './providers/ThemeProvider';
import AuthProvider from './providers/AuthProvider';

import MainDashboardPage from './pages/Dashboard/MainDashboardPage';
import PhotoGalleryPage from './pages/Photos/PhotoGalleryPage';
import FileManagerPage from './pages/Files/FileManagerPage';
import ResumeViewPage from './pages/Resume/ResumeViewPage';
import ResumeEditPage from './pages/Resume/ResumeEditPage';
import ResumeListPage from './pages/Resume/ResumeListPage';
import LoginPage from './pages/Auth/LoginPage';
import RegistrationPage from './pages/Auth/RegistrationPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
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
  // Use HashRouter for native platforms and BrowserRouter for web
  const Router = isNativePlatform() ? HashRouter : BrowserRouter;

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected routes with Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <MainDashboardPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/photos"
              element={
                <PrivateRoute>
                  <Layout>
                    <PhotoGalleryPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/photos/album/:albumId"
              element={
                <PrivateRoute>
                  <Layout>
                    <AlbumViewComponent />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/photos/:photoId"
              element={
                <PrivateRoute>
                  <Layout>
                    <PhotoDetailViewComponent />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/files"
              element={
                <PrivateRoute>
                  <Layout>
                    <FileManagerPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <PrivateRoute>
                  <Layout>
                    <ResumeListPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/resume/:resumeId"
              element={
                <PrivateRoute>
                  <Layout>
                    <ResumeViewPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/resume/edit/:resumeId"
              element={
                <PrivateRoute>
                  <Layout>
                    <ResumeEditPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <PrivateRoute>
                  <Layout>
                    <NotesListPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/notes/:noteId"
              element={
                <PrivateRoute>
                  <Layout>
                    <TextNoteViewPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <PrivateRoute>
                  <Layout>
                    <BookmarkManagerPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/passwords"
              element={
                <PrivateRoute>
                  <Layout>
                    <PasswordListPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <PrivateRoute>
                  <Layout>
                    <WalletDashboardPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voice-memos"
              element={
                <PrivateRoute>
                  <Layout>
                    <VoiceMemoListPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <UserProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            {/* Add more routes here for other features */}
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

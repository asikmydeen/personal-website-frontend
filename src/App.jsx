import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';

import MainDashboardPage from './pages/Dashboard/MainDashboardPage';
import PhotoGalleryPage from './pages/Photos/PhotoGalleryPage';
import FileManagerPage from './pages/Files/FileManagerPage';
import ResumeViewPage from './pages/Resume/ResumeViewPage';
import LoginPage from './pages/Auth/LoginPage';
import NotesListPage from './pages/Notes/NotesListPage';
import TextNoteEditorPage from './pages/Notes/TextNoteEditorPage';
import TextNoteViewPage from './pages/Notes/TextNoteViewPage';
import BookmarkManagerPage from './pages/Bookmarks/BookmarkManagerPage';
import PasswordListPage from './pages/Passwords/PasswordListPage';
import WalletDashboardPage from './pages/Wallet/WalletDashboardPage';
import VoiceMemoListPage from './pages/VoiceMemos/VoiceMemoListPage';
import 'antd/dist/reset.css';

// Photo components
import PhotoDetailViewComponent from './components/photos/PhotoDetailViewComponent';
import AlbumViewComponent from './components/photos/AlbumViewComponent';

function App() {
  return (
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
                <ResumeViewPage />
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
            path="/notes/new"
            element={
              <PrivateRoute>
                <TextNoteEditorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notes/edit/:noteId"
            element={
              <PrivateRoute>
                <TextNoteEditorPage />
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
          {/* Add more routes here for other features */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';

import MainDashboardPage from './pages/Dashboard/MainDashboardPage';
import PhotoGalleryPage from './pages/Photos/PhotoGalleryPage';
import FileManagerPage from './pages/Files/FileManagerPage';
import ResumeViewPage from './pages/Resume/ResumeViewPage';
import LoginPage from './pages/Auth/LoginPage';
import 'antd/dist/reset.css';


// ... import other pages as needed

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
          {/* Add more routes here for other features */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

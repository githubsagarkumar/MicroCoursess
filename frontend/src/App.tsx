import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RoleLanding from './pages/RoleLanding';
import Login from './pages/Login';
import Register from './pages/Register';
import LearnerDemo from './pages/LearnerDemo';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Learn from './pages/Learn';
import Progress from './pages/Progress';
import CreatorApply from './pages/CreatorApply';
import CreatorDashboard from './pages/CreatorDashboard';
import AdminReview from './pages/AdminReview';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<RoleLanding />} />
              <Route path="/demo/learner" element={<LearnerDemo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/learn/:lessonId" element={
                <ProtectedRoute>
                  <Learn />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/creator/apply" element={
                <ProtectedRoute>
                  <CreatorApply />
                </ProtectedRoute>
              } />
              <Route path="/creator/dashboard" element={
                <ProtectedRoute allowedRoles={['creator', 'admin']}>
                  <CreatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/review/courses" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReview />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
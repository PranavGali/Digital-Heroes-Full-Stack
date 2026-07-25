import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PublicLeadForm from './pages/PublicLeadForm';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadDetails from './pages/LeadDetails';
import Profile from './pages/Profile';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-darkBg text-slate-100">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* Public capture form */}
              <Route path="/" element={<PublicLeadForm />} />

              {/* Login portal */}
              <Route path="/login" element={<Login />} />

              {/* Protected dashboard access */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected lead details view */}
              <Route
                path="/leads/:id"
                element={
                  <ProtectedRoute>
                    <LeadDetails />
                  </ProtectedRoute>
                }
              />

              {/* Protected user profiles */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;

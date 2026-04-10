import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import GroupSetup from './pages/GroupSetup';
import GroupDetail from './pages/GroupDetail';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import History from './pages/History';
import Profile from './pages/Profile';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-full bg-white">
      <img src="/logo.png" alt="Bora?" className="w-40 animate-pulse" />
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-full bg-white">
      <img src="/logo.png" alt="Bora?" className="w-40 animate-pulse" />
    </div>
  );
  return !user ? children : <Navigate to="/home" replace />;
}

function JoinRedirect() {
  const { user } = useAuth();
  const code = window.location.pathname.split('/join/')[1];
  if (user) return <Navigate to={`/group-setup?code=${code}`} replace />;
  return <Navigate to={`/auth?join=${code}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Onboarding /></PublicRoute>} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/join/:code" element={<JoinRedirect />} />
      <Route path="/group-setup" element={<PrivateRoute><GroupSetup /></PrivateRoute>} />
      <Route path="/group/:id" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/create" element={<PrivateRoute><CreatePoll /></PrivateRoute>} />
      <Route path="/poll/:id" element={<PrivateRoute><PollDetail /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

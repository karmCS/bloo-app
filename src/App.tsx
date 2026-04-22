import { useCallback, useState } from 'react';
import { Agentation } from 'agentation';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import Homepage from './pages/Homepage';
import RestaurantPage from './pages/RestaurantPage';
import AdminLogin from './pages/AdminLogin';
import VendorLogin from './pages/VendorLogin';
import AuthRedirect from './components/AuthRedirect';
import Unauthorized from './pages/Unauthorized';
import AdminPanel from './pages/AdminPanel';
import VendorPanel from './pages/VendorPanel';
import ProtectedRoute from './components/ProtectedRoute';

function AdminEntry() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-primary" />
      </div>
    );
  }
  if (!isSignedIn) return <AdminLogin />;
  return <ProtectedRoute loginPath="/admin"><AdminPanel /></ProtectedRoute>;
}

function VendorEntry() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-primary" />
      </div>
    );
  }
  if (!isSignedIn) return <VendorLogin />;
  // Already signed in — route by role to their landing.
  return <Navigate to="/auth-redirect" replace />;
}

const AGENTATION_SESSION_KEY = 'agentation-session';

function App() {
  const [agentationSessionId, setAgentationSessionId] = useState<string | undefined>(() => {
    try { return sessionStorage.getItem(AGENTATION_SESSION_KEY) ?? undefined; }
    catch { return undefined; }
  });

  const onAgentationSessionCreated = useCallback((sessionId: string) => {
    const id = sessionId.trim();
    if (!id) return;
    try { sessionStorage.setItem(AGENTATION_SESSION_KEY, id); } catch { /* blocked */ }
    setAgentationSessionId(id);
  }, []);

  const agentationEndpoint =
    (typeof import.meta.env.VITE_AGENTATION_ENDPOINT === 'string'
      ? import.meta.env.VITE_AGENTATION_ENDPOINT.trim()
      : '') || 'http://localhost:4747';

  return (
    <Router>
      {import.meta.env.DEV && (
        <Agentation
          endpoint={agentationEndpoint}
          sessionId={agentationSessionId}
          onSessionCreated={onAgentationSessionCreated}
        />
      )}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/restaurant/:vendorId" element={<RestaurantPage />} />
        <Route path="/auth-redirect" element={<AuthRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Login entry points — render login if unauthed, dispatch if authed */}
        <Route path="/admin" element={<AdminEntry />} />
        <Route path="/vendor" element={<VendorEntry />} />

        {/* Legacy alias — old /login links still work */}
        <Route path="/login" element={<Navigate to="/vendor" replace />} />

        {/* Protected vendor panel */}
        <Route
          path="/admin/vendor/:slug"
          element={<ProtectedRoute loginPath="/vendor"><VendorPanel /></ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;

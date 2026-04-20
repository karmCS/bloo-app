import { useCallback, useState } from 'react';
import { Agentation } from 'agentation';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import RestaurantPage from './pages/RestaurantPage';
import Login from './pages/Login';
import AuthRedirect from './components/AuthRedirect';
import Unauthorized from './pages/Unauthorized';
import AdminPanel from './pages/AdminPanel';
import VendorPanel from './pages/VendorPanel';
import ProtectedRoute from './components/ProtectedRoute';

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
        <Route path="/login" element={<Login />} />
        <Route path="/auth-redirect" element={<AuthRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected */}
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/vendor/:slug" element={<ProtectedRoute><VendorPanel /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

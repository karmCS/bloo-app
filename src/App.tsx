import { useCallback, useState } from 'react';
import { Agentation } from 'agentation';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import Homepage from './pages/Homepage';
import AdminPanel from './pages/AdminPanel';
import VendorPanel from './pages/VendorPanel';
import Login from './pages/Login';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentInstructionsPage from './pages/PaymentInstructionsPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import Unauthorized from './pages/Unauthorized';

const AGENTATION_SESSION_KEY = 'agentation-session';

function App() {
  const [agentationSessionId, setAgentationSessionId] = useState<
    string | undefined
  >(() => {
    try {
      return sessionStorage.getItem(AGENTATION_SESSION_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  });

  const onAgentationSessionCreated = useCallback((sessionId: string) => {
    try {
      sessionStorage.setItem(AGENTATION_SESSION_KEY, sessionId);
    } catch {
      /* private / blocked storage */
    }
    setAgentationSessionId(sessionId);
  }, []);

  const agentationEndpoint =
    import.meta.env.VITE_AGENTATION_ENDPOINT ?? 'http://localhost:4747';

  return (
    <CartProvider>
      <Router>
        {import.meta.env.DEV && (
          <Agentation
            endpoint={agentationEndpoint}
            sessionId={agentationSessionId}
            onSessionCreated={onAgentationSessionCreated}
          />
        )}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth-redirect" element={<AuthRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/payment-instructions" element={<PaymentInstructionsPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendor/:slug"
            element={
              <ProtectedRoute>
                <VendorPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
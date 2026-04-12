import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import Homepage from './pages/Homepage';
import AdminPanel from './pages/AdminPanel';
import VendorPanel from './pages/VendorPanel';
import Login from './pages/Login';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentInstructionsPage from './pages/PaymentInstructionsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth-redirect" element={<AuthRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
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
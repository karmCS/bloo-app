import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Legacy route: manual payment instructions removed; send shoppers to checkout. */
export default function PaymentInstructionsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/checkout', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-page flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-primary" />
    </div>
  );
}

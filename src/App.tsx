import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import ParcelList from './pages/ParcelList';
import ParcelInbound from './pages/ParcelInbound';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { admin, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin /></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/parcels" replace /> : <LoginPage />} />
      <Route path="/parcels" element={<PrivateRoute><ParcelList /></PrivateRoute>} />
      <Route path="/parcels/inbound" element={<PrivateRoute><ParcelInbound /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={admin ? '/parcels' : '/login'} replace />} />
    </Routes>
  );
}

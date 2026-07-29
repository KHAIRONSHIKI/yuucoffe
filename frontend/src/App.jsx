import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { UiProvider } from './context/UiContext';
import GlobalLoading from './components/common/GlobalLoading';
import SuccessModal from './components/common/SuccessModal';
import AlertModal from './components/common/AlertModal';
import { useUi } from './context/UiContext';

// Pages to be created
import ScanTable from './pages/customer/ScanTable';
import MenuList from './pages/customer/MenuList';
import OrderTracking from './pages/customer/OrderTracking';
import Dashboard from './pages/admin/Dashboard';
import IncomingOrders from './pages/kasir/IncomingOrders';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/" />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />; // Or forbidden page
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Routes (Guest) */}
      <Route path="/" element={<ScanTable />} />
      <Route path="/menu" element={<ProtectedRoute roles={['CUSTOMER']}><MenuList /></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute roles={['CUSTOMER']}><OrderTracking /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
      
      {/* Kasir Routes */}
      <Route path="/kasir" element={<ProtectedRoute roles={['KASIR', 'ADMIN']}><IncomingOrders /></ProtectedRoute>} />
    </Routes>
  );
};

const GlobalModals = () => {
  const { alertState, closeAlert } = useUi();
  return (
    <AlertModal
      isOpen={alertState.isOpen}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onClose={closeAlert}
    />
  );
};

const App = () => {
  return (
    <Router>
      <UiProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-background text-text-main font-sans">
              <GlobalLoading />
              <SuccessModal />
              <GlobalModals />
              <AppRoutes />
            </div>
          </SocketProvider>
        </AuthProvider>
      </UiProvider>
    </Router>
  );
};

export default App;

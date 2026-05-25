import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import StockPage from './pages/StockPage';
import ReportsPage from './pages/ReportsPage';

const ProtectedLayout = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" />;
  return <Navbar>{children}</Navbar>;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated() ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!isAuthenticated() ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/products" element={<ProtectedLayout><ProductsPage /></ProtectedLayout>} />
        <Route path="/sales" element={<ProtectedLayout><SalesPage /></ProtectedLayout>} />
        <Route path="/stock" element={<ProtectedLayout><StockPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

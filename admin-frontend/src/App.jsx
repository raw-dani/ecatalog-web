import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import BankAccounts from './pages/BankAccounts';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (admin) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bank-accounts" element={<BankAccounts />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

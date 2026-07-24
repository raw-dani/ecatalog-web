import { createContext, useContext, useState, useEffect } from 'react';
import { getAdminMe, adminLogout } from '../services/adminService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      getAdminMe()
        .then(data => setAdmin(data.admin))
        .catch(() => {
          localStorage.removeItem('admin_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (adminData) => {
    setAdmin(adminData.admin);
    localStorage.setItem('admin_token', adminData.token);
  };

  const logout = async () => {
    await adminLogout();
    setAdmin(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

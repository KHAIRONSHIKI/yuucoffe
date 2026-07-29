import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const id = localStorage.getItem('id');
    const name = localStorage.getItem('name');
    const tableNum = localStorage.getItem('tableNum');
    if (token && role) {
      setUser({ token, role, username, id, name, tableNum });
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role || 'CUSTOMER');
    
    // For admin/kasir
    if (userData.username) localStorage.setItem('username', userData.username);
    
    // For customers
    if (userData.customer) {
      localStorage.setItem('id', userData.customer.id);
      localStorage.setItem('name', userData.customer.name);
      localStorage.setItem('tableNum', userData.customer.tableNum);
    }
    
    setUser({
      token: userData.token,
      role: userData.role || 'CUSTOMER',
      username: userData.username,
      id: userData.customer?.id,
      name: userData.customer?.name,
      tableNum: userData.customer?.tableNum
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('id');
    localStorage.removeItem('name');
    localStorage.removeItem('tableNum');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

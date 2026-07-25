import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            status: decoded.status,
            designation: decoded.designation,
            walletAddress: decoded.walletAddress
          });
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem('token', newToken);
  };
  const register = async (username, email, password, role = 'USER') => {
    await axios.post(`${API_URL}/api/auth/register`, { username, email, password, role });
  };
  const linkWallet = async (walletAddress) => {
    if (!token) return;
    const res = await axios.post(`${API_URL}/api/auth/link-wallet`, { walletAddress }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setUser(prev => ({ ...prev, walletAddress: res.data.walletAddress }));
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
  };
  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, linkWallet }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);

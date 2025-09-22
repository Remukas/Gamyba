import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Pradiniai vartotojai sistemoje
const initialUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@gamyba.lt',
    role: 'admin',
    name: 'Sistemos Administratorius',
    department: 'IT',
    lastLogin: new Date().toISOString(),
    isActive: true,
    permissions: ['all']
  },
  {
    id: 2,
    username: 'manager',
    password: 'manager123',
    email: 'manager@gamyba.lt',
    role: 'manager',
    name: 'Gamybos Vadovas',
    department: 'Gamyba',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
    permissions: ['view_analytics', 'manage_production', 'view_quality', 'manage_components']
  },
  {
    id: 3,
    username: 'operator',
    password: 'operator123',
    email: 'operator@gamyba.lt',
    role: 'operator',
    name: 'Gamybos Operatorius',
    department: 'Gamyba',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    isActive: true,
    permissions: ['view_production', 'update_components', 'view_tracking']
  },
  {
    id: 4,
    username: 'quality',
    password: 'quality123',
    email: 'quality@gamyba.lt',
    role: 'quality',
    name: 'Kokybės Kontrolierius',
    department: 'Kokybė',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    isActive: true,
    permissions: ['view_quality', 'manage_quality', 'view_analytics']
  }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('system-users');
    return saved ? JSON.parse(saved) : initialUsers;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('current-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('system-users', JSON.stringify(users));
  }, [users]);

  const login = async (username, password) => {
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      localStorage.setItem('current-user', JSON.stringify(updatedUser));
      
      // Atnaujinti vartotojo paskutinio prisijungimo laiką
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      
      return { success: true };
    }
    
    return { success: false, error: 'Neteisingi prisijungimo duomenys' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current-user');
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(permission);
  };

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };
  const addUser = (userData) => {
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id)) + 1,
      lastLogin: null,
      isActive: true
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId, updates) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const value = {
    currentUser,
    users,
    login,
    logout,
    hasPermission,
    isAdmin,
    addUser,
    updateUser,
    deleteUser,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
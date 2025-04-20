import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const AuthContext = createContext();

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('irrigation_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('irrigation_user');
      }
    }
    setLoading(false);
  }, []);

  // Simple login function (to be enhanced with JWT later)
  const login = (username, password) => {
    // For demo purposes, use simple credentials
    // In production, this would validate against a backend
    if (username === 'admin' && password === 'irrigation123') {
      const userData = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        role: 'admin'
      };
      
      setUser(userData);
      localStorage.setItem('irrigation_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('irrigation_user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

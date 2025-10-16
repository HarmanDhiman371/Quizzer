// Enhanced ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or your loading component
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
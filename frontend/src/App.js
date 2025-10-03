// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for OAuth redirect first
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userString = urlParams.get('user');

        if (token && userString) {
          try {
            const user = JSON.parse(decodeURIComponent(userString));
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            // Clean up URL
            window.history.replaceState({}, document.title, '/home');
            return;
          } catch (error) {
            console.error('Error parsing OAuth response:', error);
          }
        }

        // Check for existing token and refresh user data from server
        const existingToken = localStorage.getItem('token');

        if (existingToken) {
          try {
            // Always fetch fresh user data from server
            const userData = await refreshUserData();
            if (userData) {
              setUser(userData);
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (error) {
            // Token is invalid or expired, clear storage
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call logout endpoint
        await axios.post('http://localhost:5000/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Function to update user data (called from Profile component)
  const updateUser = async () => {
    const userData = await refreshUserData();
    if (userData) {
      setUser(userData);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Loading...</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route 
          path="/home" 
          element={user ? <HomePage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/profile" 
          element={user ? <Profile user={user} updateUser={updateUser} /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/login" 
          element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/home" replace />}
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/home" replace />}
        />
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/home" : "/login"} replace />}
        />
        {/* Catch all other routes */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/home" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
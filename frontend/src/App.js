// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
// import AuthSuccess from './components/AuthSuccess';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          } catch (error) {
            console.error('Error parsing OAuth response:', error);
          }
        }

        // Check for existing token
        const existingToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (existingToken && storedUser) {
          // Verify token is still valid
          const response = await axios.get('http://localhost:5000/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${existingToken}`
            }
          });

          if (response.data.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token is invalid or expired, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleRegisterSuccess = () => {
    setCurrentView('login');
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

  if (user) {
    return (
      <div className="container">
        <div className="user-profile">
          {user.profilePicture && (
            <img 
              src={user.profilePicture} 
              alt="Profile" 
              className="profile-picture"
            />
          )}
          <div className="user-info">
            <h3>Welcome back, {user.firstName} {user.lastName}!</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Login Method:</strong> {user.authProvider}</p>
          </div>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'login' ? (
        <Login 
          onSwitchToRegister={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Register 
          onSwitchToLogin={handleSwitchToLogin}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
}

export default App;
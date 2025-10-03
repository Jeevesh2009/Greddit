// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import './Login.css'; // Add this import

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Store token and user data in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setMessage(res.data.msg);
      
      if (onLoginSuccess) {
        onLoginSuccess(res.data.user);
      }
      
      // Navigate to home page
      navigate('/home');
    } catch (err) {
      if (err.response && err.response.data) {
        setMessage(err.response.data.msg);
      } else {
        setMessage('An error occurred during login. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/facebook';
  };

  return (
    <div className="login-container">
      <h2>Login to Greddit</h2>
      
      {/* OAuth Buttons */}
      <div className="oauth-buttons">
        <button 
          type="button" 
          className="oauth-button google-button"
          onClick={handleGoogleLogin}
        >
          <FaGoogle className="oauth-icon" />
          Continue with Google
        </button>
        
        <button 
          type="button" 
          className="oauth-button facebook-button"
          onClick={handleFacebookLogin}
        >
          <FaFacebookF className="oauth-icon" />
          Continue with Facebook
        </button>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      <form onSubmit={onSubmit}>
        <div>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        
        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
        {message}
      </div>}
      
      <div className="switch-form">
        <p>Don't have an account? <Link to="/register" className="link">Register here</Link></p>
      </div>
    </div>
  );
}

export default Login;
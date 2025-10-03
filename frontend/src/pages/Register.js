// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; // Add this import

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    age: '',
    contactNumber: '',
    password: '',
  });

  const { firstName, lastName, username, email, age, contactNumber, password } = formData;
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
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      setMessage(res.data.msg);
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.msg) {
        setMessage(err.response.data.msg);
      } else if (err.message === 'Network Error') {
        setMessage('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setMessage('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Join Greddit</h2>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              name="firstName"
              value={firstName}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Enter your last name"
              name="lastName"
              value={lastName}
              onChange={onChange}
              required
            />
          </div>
        </div>
        
        <div>
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            name="username"
            value={username}
            onChange={onChange}
            required
          />
        </div>
        
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
        
        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              placeholder="Your age"
              name="age"
              value={age}
              onChange={onChange}
              min="1"
              max="120"
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              placeholder="Your phone number"
              name="contactNumber"
              value={contactNumber}
              onChange={onChange}
              required
            />
          </div>
        </div>
        
        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
        {message}
      </div>}
      
      <div className="switch-form">
        <p>Already have an account? <Link to="/login" className="link">Login here</Link></p>
      </div>
    </div>
  );
}

export default Register;
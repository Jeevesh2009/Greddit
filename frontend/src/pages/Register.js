// src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSwitchToLogin, onRegisterSuccess }) {
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
      
      if (onRegisterSuccess) {
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      }
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
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              placeholder="First Name"
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
              placeholder="Last Name"
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
            placeholder="Username"
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
            placeholder="Email"
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
              placeholder="Age"
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
              placeholder="Contact Number"
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
      {message && <p className="message">{message}</p>}
      <div className="switch-form">
        <p>Already have an account? <span onClick={onSwitchToLogin} className="link">Login here</span></p>
      </div>
    </div>
  );
}

export default Register;
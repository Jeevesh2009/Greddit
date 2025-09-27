// components/Navbar.js
import React from 'react';

function Navbar({ user, onLogout }) {
  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        <div style={logoStyle}>
          <h3>Greddit</h3>
        </div>
        {user && (
          <div style={userInfoStyle}>
            <span>Welcome, {user.firstName}!</span>
            <button style={logoutButtonStyle} onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const navStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '1rem 0',
  marginBottom: '2rem'
};

const navContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 1rem'
};

const logoStyle = {
  margin: 0
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const logoutButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'transparent',
  color: 'white',
  border: '1px solid white',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default Navbar;
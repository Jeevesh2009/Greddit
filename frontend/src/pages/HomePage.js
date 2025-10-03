import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage({ user }) {
  return (
    <div className="home-container">
      <div className="welcome-section">
        <div className="welcome-card">
          <h1>Welcome to Greddit, {user.firstName}! 👋</h1>
          <p>Your social community platform</p>
          
          <div className="home-links">
            <Link to="/profile" className="home-link">
              Edit Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
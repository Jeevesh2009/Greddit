// components/Navbar.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaUser,
  FaSignOutAlt,
  FaSearch,
  FaTimes,
  FaUserPlus,
  FaUserMinus,
} from 'react-icons/fa';
import axios from 'axios';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Refs for handling clicks outside
  const searchRef = useRef(null);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActivePath = (path) => location.pathname === path;

  // Handle clicks outside search area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (query.length < 2) return;

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/users/search?username=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Filter out current user from results
      const filteredResults = response.data.filter(searchUser => searchUser._id !== (user.id || user._id));
      setSearchResults(filteredResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    try {
      const token = localStorage.getItem('token');
      const isFollowing = targetUser.isFollowing;
      
      if (isFollowing) {
        // Unfollow
        await axios.delete(
          `http://localhost:5000/api/users/${targetUser._id}/unfollow`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        // Follow
        await axios.post(
          `http://localhost:5000/api/users/${targetUser._id}/follow`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }

      // Update search results to reflect the new follow status
      setSearchResults(prevResults => 
        prevResults.map(searchUser => 
          searchUser._id === targetUser._id 
            ? { ...searchUser, isFollowing: !isFollowing }
            : searchUser
        )
      );

    } catch (error) {
      console.error('Follow/Unfollow error:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container-full">
        {/* Website Name - Leftmost */}
        <Link to="/home" className="navbar-logo">
          <h2>Greddit</h2>
        </Link>

        {/* Search Bar - Takes up remaining space */}
        <div className="navbar-search-expanded" ref={searchRef}>
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              className="search-input-expanded"
            />
            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="search-results">
              {searchLoading ? (
                <div className="search-loading">
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map(searchUser => (
                    <div key={searchUser._id} className="search-result-item">
                      <div className="search-user-info">
                        {searchUser.profilePicture ? (
                          <img 
                            src={searchUser.profilePicture} 
                            alt={searchUser.username}
                            className="search-user-avatar"
                          />
                        ) : (
                          <div className="search-user-avatar-placeholder">
                            <FaUser />
                          </div>
                        )}
                        <div className="search-user-details">
                          <span className="search-username">@{searchUser.username}</span>
                          <span className="search-fullname">
                            {searchUser.firstName} {searchUser.lastName}
                          </span>
                        </div>
                      </div>
                      <button 
                        className={`follow-btn ${searchUser.isFollowing ? 'following' : 'not-following'}`}
                        onClick={() => handleFollowToggle(searchUser)}
                      >
                        {searchUser.isFollowing ? (
                          <>
                            <FaUserMinus />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <FaUserPlus />
                            Follow
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-no-results">
                  <span>No users found for "{searchQuery}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links - Rightmost in order */}
        <div className="navbar-links-right">
          <Link 
            to="/profile" 
            className={`navbar-link-item ${isActivePath('/profile') ? 'active' : ''}`}
          >
            {user && user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="navbar-profile-picture-small"
              />
            ) : (
              <FaUser className="navbar-icon" />
            )}
            <span className="navbar-text">Profile</span>
          </Link>

          <button className="navbar-logout-item" onClick={handleLogout}>
            <FaSignOutAlt className="navbar-icon" />
            <span className="navbar-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
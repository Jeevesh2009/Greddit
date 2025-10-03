import React, { useState } from 'react';
import { 
  FaUser, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaUsers, 
  FaUserFriends,
  FaUserMinus 
} from 'react-icons/fa';
import axios from 'axios';
import './Profile.css';

function Profile({ user, updateUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    age: user.age || '',
    contactNumber: user.contactNumber || ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Get the correct user ID (handle both 'id' and '_id')
  const getUserId = () => {
    return user.id || user._id;
  };

  const handleInputChange = (e) => {
    setEditedProfile({
      ...editedProfile,
      [e.target.name]: e.target.value
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditedProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: user.age || '',
        contactNumber: user.contactNumber || ''
      });
    }
    setIsEditing(!isEditing);
    setMessage('');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        editedProfile,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update the parent App component's user state
      if (updateUser) {
        await updateUser();
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      setMessage(error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserId();
      
      const response = await axios.get(
        `http://localhost:5000/api/users/${userId}/followers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setFollowers(response.data);
      setShowFollowersModal(true);
    } catch (error) {
      setMessage('Failed to fetch followers');
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserId();
      
      const response = await axios.get(
        `http://localhost:5000/api/users/${userId}/following`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setFollowing(response.data);
      setShowFollowingModal(true);
    } catch (error) {
      setMessage('Failed to fetch following');
    }
  };

  const removeFollower = async (followerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/users/followers/${followerId}/remove`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update followers list
      setFollowers(followers.filter(follower => follower._id !== followerId));
      setMessage('Follower removed successfully');
      
      // Update parent user data
      if (updateUser) {
        await updateUser();
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to remove follower');
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/users/${userId}/unfollow`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update following list
      setFollowing(following.filter(followedUser => followedUser._id !== userId));
      setMessage('User unfollowed successfully');
      
      // Update parent user data
      if (updateUser) {
        await updateUser();
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to unfollow user');
    }
  };

  const closeModal = () => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
  };

  const FollowersModal = ({ isOpen, onClose, followers }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content follow-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Followers</h3>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="modal-body-scrollable">
            {followers.length > 0 ? (
              <ul className="follow-list">
                {followers.map((follower) => (
                  <li key={follower._id} className="follow-item">
                    <div className="follow-user-info">
                      <div className="follow-avatar-placeholder">
                        <FaUser />
                      </div>
                      <div className="follow-details">
                        <span className="follow-username">@{follower.username}</span>
                        <span className="follow-name">
                          {follower.firstName} {follower.lastName}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="follow-action"
                      onClick={() => removeFollower(follower._id)}
                    >
                      <FaUserMinus /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-follow-message">
                No followers yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FollowingModal = ({ isOpen, onClose, following }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content follow-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Following</h3>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="modal-body-scrollable">
            {following.length > 0 ? (
              <ul className="follow-list">
                {following.map((followedUser) => (
                  <li key={followedUser._id} className="follow-item">
                    <div className="follow-user-info">
                      <div className="follow-avatar-placeholder">
                        <FaUser />
                      </div>
                      <div className="follow-details">
                        <span className="follow-username">@{followedUser.username}</span>
                        <span className="follow-name">
                          {followedUser.firstName} {followedUser.lastName}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="follow-action"
                      onClick={() => unfollowUser(followedUser._id)}
                    >
                      <FaUserMinus /> Unfollow
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-follow-message">
                Not following anyone yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture-placeholder">
              <FaUser className="placeholder-icon" />
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-name-section">
              <h1>@{user.username}</h1>
              <button 
                className="edit-button"
                onClick={handleEditToggle}
                disabled={loading}
              >
                {isEditing ? <FaTimes /> : <FaEdit />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {/* Followers and Following Stats */}
            <div className="profile-stats">
              <div 
                className="stat-item clickable" 
                onClick={fetchFollowers}
              >
                <FaUsers className="stat-icon" />
                <span className="stat-number">{user.followersCount || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
              
              <div 
                className="stat-item clickable" 
                onClick={fetchFollowing}
              >
                <FaUserFriends className="stat-icon" />
                <span className="stat-number">{user.followingCount || 0}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <h2>Profile Details</h2>
          
          <div className="details-grid">
            <div className="detail-item">
              <label>First Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={editedProfile.firstName}
                  onChange={handleInputChange}
                  className="edit-input"
                  required
                />
              ) : (
                <span>{user.firstName}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Last Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={editedProfile.lastName}
                  onChange={handleInputChange}
                  className="edit-input"
                  required
                />
              ) : (
                <span>{user.lastName}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Email:</label>
              <span>{user.email}</span>
              <small>(Cannot be changed)</small>
            </div>

            <div className="detail-item">
              <label>Username:</label>
              <span>@{user.username}</span>
              <small>(Cannot be changed)</small>
            </div>

            <div className="detail-item">
              <label>Age:</label>
              {isEditing ? (
                <input
                  type="number"
                  name="age"
                  value={editedProfile.age}
                  onChange={handleInputChange}
                  className="edit-input"
                  min="1"
                  max="120"
                />
              ) : (
                <span>{user.age || 'Not specified'}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Contact Number:</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="contactNumber"
                  value={editedProfile.contactNumber}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              ) : (
                <span>{user.contactNumber || 'Not specified'}</span>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="edit-actions">
              <button 
                className="save-button"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      <FollowersModal 
        isOpen={showFollowersModal} 
        onClose={closeModal} 
        followers={followers} 
      />

      {/* Following Modal */}
      <FollowingModal 
        isOpen={showFollowingModal} 
        onClose={closeModal} 
        following={following} 
      />
    </div>
  );
}

export default Profile;
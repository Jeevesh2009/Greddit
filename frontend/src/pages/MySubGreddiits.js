import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaUsers, 
  FaFileAlt, 
  FaTrash, 
  FaEye, 
  FaEdit,
  FaTimes,
  FaImage,
  FaLock,
  FaGlobe,
  FaTag,
  FaCalendarAlt,
  FaShieldAlt
} from 'react-icons/fa';
import axios from 'axios';

function MySubGreddiits({ user }) {
  const navigate = useNavigate();
  const [subGreddiits, setSubGreddiits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bannedKeywords: '',
    tags: '',
    image: '',
    isPublic: true
  });

  // Fetch user's SubGreddiits
  const fetchMySubGreddiits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/subgreddiits/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSubGreddiits(response.data);
    } catch (error) {
      console.error('Fetch SubGreddiits error:', error);
      setMessage('Failed to load SubGreddiits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubGreddiits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview('');
  };

  const handleCreateSubGreddiit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/subgreddiits',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage('SubGreddiit created successfully!');
      setShowCreateModal(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        bannedKeywords: '',
        tags: '',
        image: '',
        isPublic: true
      });
      setImagePreview('');
      
      // Refresh the list
      await fetchMySubGreddiits();
      
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Create SubGreddiit error:', error);
      setMessage(error.response?.data?.msg || 'Failed to create SubGreddiit');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSubGreddiit = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all posts and cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/subgreddiits/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage('SubGreddiit deleted successfully');
      await fetchMySubGreddiits();
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Delete SubGreddiit error:', error);
      setMessage(error.response?.data?.msg || 'Failed to delete SubGreddiit');
    }
  };

  const handleOpenSubGreddiit = (id) => {
    navigate(`/subgreddiits/${id}`);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      bannedKeywords: '',
      tags: '',
      image: '',
      isPublic: true
    });
    setImagePreview('');
    setMessage('');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading your SubGreddiits...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="my-subgreddiits-container">
      <div className="my-subgreddiits-header">
        <div className="header-content">
          <h1>My SubGreddiits</h1>
          <p>Create and manage your communities</p>
        </div>
        <button 
          className="create-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus />
          Create SubGreddiit
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="subgreddiits-grid">
        {subGreddiits.length === 0 ? (
          <div className="empty-state">
            <FaUsers className="empty-icon" />
            <h3>No SubGreddiits Yet</h3>
            <p>Create your first SubGreddiit to start building your community!</p>
            <button 
              className="create-button-alt"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus />
              Create Your First SubGreddiit
            </button>
          </div>
        ) : (
          subGreddiits.map(subGreddiit => (
            <div key={subGreddiit._id} className="subgreddiit-card">
              {/* Card Header with Image and Basic Info */}
              <div className="card-header">
                <div className="card-image-section">
                  {subGreddiit.image ? (
                    <img 
                      src={subGreddiit.image} 
                      alt={subGreddiit.name}
                      className="subgreddiit-banner"
                    />
                  ) : (
                    <div className="subgreddiit-banner-placeholder">
                      <FaUsers />
                    </div>
                  )}
                  <div className="privacy-badge">
                    {subGreddiit.isPublic ? (
                      <FaGlobe title="Public SubGreddiit" />
                    ) : (
                      <FaLock title="Private SubGreddiit" />
                    )}
                  </div>
                </div>
                
                <div className="card-title-section">
                  <h3 className="subgreddiit-name">g/{subGreddiit.name}</h3>
                  <p className="subgreddiit-description">{subGreddiit.description}</p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="card-stats">
                <div className="stat-item">
                  <FaUsers className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{subGreddiit.followersCount || 0}</span>
                    <span className="stat-label">Members</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaFileAlt className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{subGreddiit.postsCount || 0}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaShieldAlt className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-number">{subGreddiit.moderators?.length || 1}</span>
                    <span className="stat-label">Mods</span>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              {subGreddiit.tags && subGreddiit.tags.length > 0 && (
                <div className="card-tags">
                  <FaTag className="tags-icon" />
                  <div className="tags-list">
                    {subGreddiit.tags.slice(0, 4).map((tag, index) => (
                      <span key={index} className="tag-chip">#{tag}</span>
                    ))}
                    {subGreddiit.tags.length > 4 && (
                      <span className="tag-more">+{subGreddiit.tags.length - 4}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Banned Keywords */}
              {subGreddiit.bannedKeywords && subGreddiit.bannedKeywords.length > 0 && (
                <div className="card-keywords">
                  <strong>Banned Keywords:</strong>
                  <span className="keywords-text">
                    {subGreddiit.bannedKeywords.slice(0, 3).join(', ')}
                    {subGreddiit.bannedKeywords.length > 3 && '...'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="card-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => handleOpenSubGreddiit(subGreddiit._id)}
                  title="Open SubGreddiit"
                >
                  <FaEye />
                  Open
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleDeleteSubGreddiit(subGreddiit._id, subGreddiit.name)}
                  title="Delete SubGreddiit"
                >
                  <FaTrash />
                  Delete
                </button>
              </div>

              {/* Footer */}
              <div className="card-footer">
                <div className="footer-info">
                  <FaCalendarAlt className="footer-icon" />
                  <span>Created {new Date(subGreddiit.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="footer-status">
                  {subGreddiit.isPublic ? (
                    <span className="status-public">Public</span>
                  ) : (
                    <span className="status-private">Private</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create SubGreddiit Modal - Keep the same as before */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New SubGreddiit</h3>
              <button className="close-button" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubGreddiit} className="create-form">
              <div className="form-section">
                <div className="form-group">
                  <label>SubGreddiit Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter a unique name"
                    required
                    maxLength={50}
                  />
                  <small>This will appear as g/{formData.name}</small>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your SubGreddiit is about"
                    required
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="gaming, technology, discussion (comma separated)"
                  />
                  <small>Help people discover your SubGreddiit</small>
                </div>

                <div className="form-group">
                  <label>Banned Keywords</label>
                  <input
                    type="text"
                    name="bannedKeywords"
                    value={formData.bannedKeywords}
                    onChange={handleInputChange}
                    placeholder="spam, hate, toxic (comma separated)"
                  />
                  <small>Posts containing these words will be blocked</small>
                </div>

                <div className="form-group">
                  <label>SubGreddiit Image (Optional)</label>
                  <div className="image-upload-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="image-upload"
                      className="image-input"
                    />
                    <label htmlFor="image-upload" className="image-upload-button">
                      <FaImage />
                      Choose Image
                    </label>
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          type="button" 
                          className="remove-image"
                          onClick={removeImage}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Make this SubGreddiit public
                  </label>
                  <small>Public SubGreddiits can be discovered and joined by anyone</small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create SubGreddiit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MySubGreddiits;
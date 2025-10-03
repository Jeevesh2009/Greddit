import React from 'react';
import { FaBookmark } from 'react-icons/fa';

function SavedPosts() {
  return (
    <div className="page-container">
      <div className="coming-soon-card">
        <FaBookmark className="page-icon" />
        <h1>Saved Posts</h1>
        <p>View your bookmarked and saved posts</p>
        <div className="coming-soon-badge">
          Coming Soon
        </div>
      </div>
    </div>
  );
}

export default SavedPosts;
import React from 'react';
import { FaComments } from 'react-icons/fa';

function SubGreddiits() {
  return (
    <div className="page-container">
      <div className="coming-soon-card">
        <FaComments className="page-icon" />
        <h1>Sub Greddiits</h1>
        <p>Discover and join communities that interest you</p>
        <div className="coming-soon-badge">
          Coming Soon
        </div>
      </div>
    </div>
  );
}

export default SubGreddiits;
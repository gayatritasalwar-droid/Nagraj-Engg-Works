import React, { useState } from 'react';
import './CommonStyles.css';

const WorkerReviewModal = ({ worker, onClose, onApprove, onReject }) => {
  const [comments, setComments] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3><i className="fas fa-file-alt"></i> Review Application</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Name:</strong> {worker.fullName}</p>
          <p><strong>Application ID:</strong> {worker.applicationId}</p>
          <p><strong>Department:</strong> {worker.department}</p>
          <p><strong>Designation:</strong> {worker.designation}</p>
          <p><strong>Age:</strong> {worker.age} years</p>
          <p><strong>Experience:</strong> {worker.experience || 'Fresher'}</p>
          <p><strong>Email:</strong> {worker.email}</p>
          <p><strong>Phone:</strong> {worker.phone}</p>
          <p><strong>Address:</strong> {worker.address || 'Not specified'}</p>
          <p><strong>Punch Code:</strong> <code>{worker.punchCode}</code></p>
        </div>
        
        <div className="form-group">
          <label>Review Comments</label>
          <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add comments..."></textarea>
        </div>
        
        <div className="modal-buttons">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={() => onReject(worker, comments)}>Reject</button>
          <button className="btn-success" onClick={() => onApprove(worker, comments)}>Approve & Forward</button>
        </div>
      </div>
    </div>
  );
};

export default WorkerReviewModal;
import React from 'react';
import './Popup.css';

const Popup = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <button className="popup-close-btn" onClick={onClose}>X</button>
        </div>
        <div className="popup-body">
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Popup;

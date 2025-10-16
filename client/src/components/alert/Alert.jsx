// Alert.jsx - Inline alert component
import React from 'react';

const Alert = ({ type = 'info', title, message, children }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{getIcon()}</span>
      <div className="alert-content">
        {title && <h4 className="alert-title">{title}</h4>}
        {message && <p className="alert-message">{message}</p>}
        {children}
      </div>
    </div>
  );
};

export default Alert;
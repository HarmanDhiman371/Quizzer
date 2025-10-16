// Modal.jsx - Reusable Modal Component
import React, { useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  message, 
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCloseButton = true,
  children 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '❓';
      case 'loading': return '⏳';
      default: return 'ℹ️';
    }
  };

  const getModalClass = () => {
    switch (type) {
      case 'success': return 'success-dialog';
      case 'error': return 'error-dialog';
      case 'warning': return 'confirmation-dialog';
      case 'loading': return 'loading-dialog';
      default: return '';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${getModalClass()}`} onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        )}
        
        <div className="modal-header">
          <span className="modal-icon">{getIcon()}</span>
          <h2 className="modal-title">{title}</h2>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        </div>

        <div className="modal-body">
          {message && <p className="modal-message">{message}</p>}
          {children}
        </div>

        <div className="modal-footer">
          {(type === 'confirm' || onCancel) && (
            <button className="modal-btn modal-btn-secondary" onClick={onCancel || onClose}>
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button 
              className={`modal-btn ${
                type === 'error' ? 'modal-btn-danger' : 
                type === 'success' ? 'modal-btn-success' : 
                type === 'warning' ? 'modal-btn-warning' : 
                'modal-btn-primary'
              }`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
          {!onConfirm && type !== 'confirm' && (
            <button className="modal-btn modal-btn-primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
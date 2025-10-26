import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/alert/Modal';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showAlert = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
      onCancel: null
    });
  };

  const showConfirm = (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm,
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false })),
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}
      
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm ? handleConfirm : null}
        onCancel={modal.onCancel}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </AlertContext.Provider>
  );
};
import React, { createContext, useState, useContext } from 'react';

const UiContext = createContext();

export const useUi = () => useContext(UiContext);

export const UiProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({ isLoading: false, message: 'Memproses...' });
  const [successState, setSuccessState] = useState({ isOpen: false, message: '' });
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showLoading = (isLoading = true, message = 'Memproses...') => {
    setLoadingState({ isLoading, message });
  };

  const showSuccess = (message) => {
    setSuccessState({ isOpen: true, message });
    // Automatically close success modal after 2.5 seconds
    setTimeout(() => {
      setSuccessState({ isOpen: false, message: '' });
    }, 2500);
  };

  const showAlert = (message, title = 'Terjadi Kesalahan', type = 'error') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertState({ isOpen: false, title: '', message: '', type: 'error' });
  };

  return (
    <UiContext.Provider value={{ showLoading, showSuccess, showAlert, closeAlert, loadingState, successState, alertState }}>
      {children}
    </UiContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Only connect if user is logged in
    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL 
        || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'https://yuucoffe-production.up.railway.app');
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

// Update the interface to include socket
interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  rating: number | null;
  socket: Socket | null;
  login: (uid: string, token: string) => void;
  logout: () => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userId: null,
  token: null,
  rating: null,
  socket: null,
  login: () => {},
  logout: () => {},
  connectSocket: () => {},
  disconnectSocket: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Socket connection function
  const connectSocket = useCallback(() => {
    if (token && !socket) {
      const newSocket = io('http://localhost:8080"', {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Socket connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      setSocket(newSocket);
    }
  }, [token, socket]);

  // Socket disconnection function
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  const login = async (uid: string, authToken: string) => {
    const timestamp = Date.now();
    setUserId(uid);
    setToken(authToken);
    await AsyncStorage.setItem("userId", uid);
    await AsyncStorage.setItem("token", authToken);
    await AsyncStorage.setItem("loginTimestamp", timestamp.toString());
    
    // Automatically connect socket after login
    connectSocket();
  };

  const logout = async () => {
    // Disconnect socket before logging out
    disconnectSocket();

    setUserId(null);
    setToken(null);
    await AsyncStorage.removeItem("userId");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("loginTimestamp");
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedToken = await AsyncStorage.getItem("token");
      const storedTimestamp = await AsyncStorage.getItem("loginTimestamp");

      if (storedUserId && storedToken && storedTimestamp) {
        const loginTime = parseInt(storedTimestamp, 10);
        const currentTime = Date.now();
        const elapsedTime = currentTime - loginTime;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (elapsedTime < twentyFourHours) {
          setUserId(storedUserId);
          setToken(storedToken);
          
          // Restore socket connection
          connectSocket();
        } else {
          await logout(); // Auto logout if session expired
        }
      }
    };
    restoreSession();

    // Cleanup socket on component unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn: !!userId, 
        userId, 
        token, 
        rating: null, 
        socket, 
        login, 
        logout,
        connectSocket,
        disconnectSocket 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
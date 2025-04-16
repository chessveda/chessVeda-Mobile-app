import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  rating: number | null;
  socket: Socket | null;
  isSocketConnected: boolean;
  login: (uid: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userId: null,
  token: null,
  rating: null,
  socket: null,
  isSocketConnected: false,
  login: async () => {},
  logout: async () => {},
  connectSocket: () => {},
  disconnectSocket: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  const connectSocket = useCallback(() => {
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Initializing new socket connection...');
    const newSocket = io('http://172.16.0.112:8080', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5, // Limit reconnection attempts
      reconnectionDelay: 1000,
      transports: ['websocket'],
      timeout: 200000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      setIsSocketConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsSocketConnected(false);
      if (reason === 'io server disconnect') {
        // Server-initiated disconnect (e.g., invalid token)
        logout();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setIsSocketConnected(false);
      if (err.message.includes('Authentication error')) {
        logout(); // Force logout on auth failure
      }
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [token]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting socket...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsSocketConnected(false);
    }
  }, []);

  const login = async (uid: string, authToken: string) => {
    try {
      const timestamp = Date.now();
      setUserId(uid);
      setToken(authToken);
      await AsyncStorage.multiSet([
        ["userId", uid],
        ["token", authToken],
        ["loginTimestamp", timestamp.toString()],
      ]);
      connectSocket();
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Allow caller to handle the error
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["userId", "token", "loginTimestamp"]);
      setUserId(null);
      setToken(null);
      router.replace('/auth'); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  useEffect(() => {
    const restoreSession = async () => {
      try {
        const results = await AsyncStorage.multiGet([
          "userId",
          "token",
          "loginTimestamp",
        ]);

        const [
          [, storedUserId],
          [, storedToken],
          [, storedTimestamp],
        ] = results as [[string, string | null], [string, string | null], [string, string | null]];

        if (storedUserId && storedToken && storedTimestamp) {
          const loginTime = parseInt(storedTimestamp, 10);
          const currentTime = Date.now();
          const elapsedTime = currentTime - loginTime;
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (elapsedTime < twentyFourHours) {
            setUserId(storedUserId);
            setToken(storedToken);
          } else {
            await logout();
          }
        }
      } catch (error) {
        console.error('Session restoration error:', error);
      }
    };

    restoreSession();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  // Socket reconnection handling
  useEffect(() => {
    if (token && !isSocketConnected && !socketRef.current) {
      connectSocket();
    }
  }, [token, isSocketConnected, connectSocket]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!userId,
        userId,
        token,
        rating: null, // Update this if you add rating fetching
        socket,
        isSocketConnected,
        login,
        logout,
        connectSocket,
        disconnectSocket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
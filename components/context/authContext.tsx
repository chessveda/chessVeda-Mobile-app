import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
  rating: number | null;
  login: (uid: string, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userId: null,
  token: null,
  rating: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Login function to update state and store data
  const login = async (uid: string, authToken: string) => {
    setUserId(uid);
    setToken(authToken);
    await AsyncStorage.setItem("userId", uid);
    await AsyncStorage.setItem("token", authToken);
  };

  // Logout function to clear state and storage
  const logout = async () => {
    setUserId(null);
    setToken(null);
    await AsyncStorage.removeItem("userId");
    await AsyncStorage.removeItem("token");
  };

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedToken = await AsyncStorage.getItem("token");
      if (storedUserId && storedToken) {
        setUserId(storedUserId);
        setToken(storedToken);
      }
    };
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!userId, userId, token, rating: null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

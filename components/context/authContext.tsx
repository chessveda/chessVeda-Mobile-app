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

  const login = async (uid: string, authToken: string) => {
    const timestamp = Date.now(); // Store the login time
    setUserId(uid);
    setToken(authToken);
    await AsyncStorage.setItem("userId", uid);
    await AsyncStorage.setItem("token", authToken);
    await AsyncStorage.setItem("loginTimestamp", timestamp.toString());
  };

  const logout = async () => {
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
        } else {
          await logout(); // Auto logout if session expired
        }
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

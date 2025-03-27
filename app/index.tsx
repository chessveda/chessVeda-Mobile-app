import { Redirect } from 'expo-router';
import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/components/context/authContext';

export default function Index() {
  const { userId, token } = useContext(AuthContext);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedToken = await AsyncStorage.getItem("token");
        const storedTimestamp = await AsyncStorage.getItem("loginTimestamp");

        if (storedUserId && storedToken && storedTimestamp) {
          const loginTime = parseInt(storedTimestamp, 10);
          const currentTime = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (currentTime - loginTime < twentyFourHours) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.warn("Error checking authentication:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/home" : "/auth"} />;
}

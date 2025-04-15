// index.tsx 
import { Redirect } from 'expo-router';
import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '@/components/context/authContext';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';


type RedirectPath = "/home" | "/auth";

export default function Index() {
  const { isLoggedIn, userId } = useContext(AuthContext);
  const [isChecking, setIsChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [authComplete, setAuthComplete] = useState(false);
  const [redirectPath, setRedirectPath] = useState<RedirectPath | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First just hide the splash screen
        setTimeout(() => {
          setShowSplash(false);
        }, 2000);

        // Give AuthContext time to restore the session
        setTimeout(() => {
          console.log('Auth check complete. isLoggedIn:', isLoggedIn, 'userId:', userId);
          setIsChecking(false);
          setAuthComplete(true); // Mark authentication check as complete
        }, 5000);
      } catch (e) {
        console.error('Auth check error:', e);
        setIsChecking(false);
        setShowSplash(false);
        setAuthComplete(true);
      }
    };
    
    checkAuthStatus();
    return () => {};
  }, []);

  // Separate useEffect to handle redirect logic after auth state is known
  useEffect(() => {
    if (authComplete) {
      const path: RedirectPath = isLoggedIn ? "/home" : "/auth";
      setRedirectPath(path);
      console.log('Redirect path set to:', path);
    }
  }, [authComplete, isLoggedIn]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isChecking || !authComplete) {
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

  if (redirectPath) {
    console.log('Redirecting to:', redirectPath);
    return <Redirect href={redirectPath} />;
  }

  // Fallback with explicit path
  return <Redirect href="/auth" />;
}
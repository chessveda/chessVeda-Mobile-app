// index.tsx 
import { Redirect } from 'expo-router';
import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { AuthContext } from '@/components/context/authContext';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { isLoggedIn, userId } = useContext(AuthContext);
  const [isChecking, setIsChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const checkStorageDebug = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys);
        const info = items
          .filter(([key]) => ['userId', 'token', 'loginTimestamp'].includes(key))
          .map(([key, value]) => `${key}: ${key === 'token' ? (value ? 'exists' : 'null') : value}`)
          .join('\n');
        
        setDebugInfo(info);
        
        // Give AuthContext time to restore the session (longer time for debug)
        setTimeout(() => {
          console.log('Auth check complete. isLoggedIn:', isLoggedIn, 'userId:', userId);
          setIsChecking(false);
          setShowSplash(false);
        }, 5000);
      } catch (e) {
        console.error('Debug error:', e);
        setDebugInfo('Error checking storage');
        setIsChecking(false);
        setShowSplash(false);
      }
    };
    
    checkStorageDebug();
    return () => {};
  }, [isLoggedIn, userId]);

  if (showSplash) {
    return <SplashScreen />;
  }

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
        <Text style={{ color: 'white', marginTop: 20 }}>
          {debugInfo}
        </Text>
      </View>
    );
  }

  console.log('Redirecting to:', isLoggedIn ? '/home' : '/auth');
  return <Redirect href={isLoggedIn ? "/home" : "/auth"} />;
}
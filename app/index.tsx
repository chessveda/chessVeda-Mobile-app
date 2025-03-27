import { Redirect } from 'expo-router';
import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '@/components/context/authContext';

export default function Index() {
  const { userId } = useContext(AuthContext);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Simulate a short delay (e.g., fetching user session)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(error);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#121212' 
      }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return <Redirect href={"/auth"} />;
}

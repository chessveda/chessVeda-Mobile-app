// components/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import logo from "@/assets/images/logo-icon.png";

const SplashScreen = () => {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    // 1. First fade in the logo
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. After a delay, animate in the text with a slide-up effect
    const textAnimationDelay = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }, 800); // Delay the text animation by 800ms after logo appears

    // 3. Start the exit animation after showing the full splash screen
    const exitAnimationDelay = setTimeout(() => {
      Animated.parallel([
        // Move entire content upward
        Animated.timing(translateY, {
          toValue: -300,
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade out gradually
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Navigate to auth after animation completes
        router.replace('/auth');
      });
    }, 3000); // Wait 3 seconds before exiting (increased from 2s to give time for text animation)

    return () => {
      clearTimeout(textAnimationDelay);
      clearTimeout(exitAnimationDelay);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container, 
        { 
          opacity, 
          transform: [{ translateY }]
        }
      ]}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} />
      </View>
      
      {/* App Name with delayed animation */}
      <Animated.Text 
        style={[
          styles.appName,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }]
          }
        ]}
      >
        Chess Veda
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 71,
    height: 120,
    borderRadius: 52,
  },
  appName: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
  }
});

export default SplashScreen;
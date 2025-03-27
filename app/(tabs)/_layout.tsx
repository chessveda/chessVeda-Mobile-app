import React from "react";
import { Tabs } from "expo-router";
import   { MaterialIcons }  from "@expo/vector-icons"; 

export default function Layout() {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: 'transparent',
        },
        tabBarActiveTintColor: '#4CAF50', // Primary color
        tabBarInactiveTintColor: '#666666',
      }}
    >
   
      <Tabs.Screen 
        name="home" 
        options={{ 
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          )
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          )
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          )
        }} 
      />
    </Tabs>
  );
}
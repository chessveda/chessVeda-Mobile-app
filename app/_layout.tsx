import { Stack } from 'expo-router';
import { AuthProvider } from '@/components/context/authContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="newGame" />
          <Stack.Screen name="auth" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
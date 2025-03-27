import { Stack } from 'expo-router';
import { AuthProvider } from '@/components/context/authContext'; // Adjust the path if needed

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}

import { Stack } from 'expo-router';
import { AuthProvider } from '@/components/context/authContext'; // Adjust the path if needed

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          animation: 'fade',
          contentStyle: { backgroundColor: '#000' },
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
   
// app/InitialLayout.tsx
import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // Redirect away from auth screens if user is signed in
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      // Redirect to auth screens if user is not signed in
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, segments, isLoaded]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
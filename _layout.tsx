import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Spots', // TODO: your app name
        headerStyle: { backgroundColor: '#14213d' },
        headerTintColor: '#ffffff',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Spots' }} />
      {/* app/spots/[id].tsx is registered automatically */}
    </Stack>
  );
}

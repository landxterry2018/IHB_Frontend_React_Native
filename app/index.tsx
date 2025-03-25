import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs home page
  return <Redirect href="/(tabs)" />;
} 
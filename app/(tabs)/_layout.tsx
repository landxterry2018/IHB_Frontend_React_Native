import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { BurgerMenu } from '@/components/BurgerMenu';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const router = useRouter();

  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };

  const handleMenuClose = () => {
    setIsMenuVisible(false);
  };

  // Direct navigation helper for demonstration purposes - removed as it's not working

  return (
    <>
      <BurgerMenu isVisible={isMenuVisible} onClose={handleMenuClose} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          // Add the burger menu to all screens
          headerLeft: () => (
            <Pressable onPress={handleMenuPress} style={{ marginLeft: 16 }}>
              <Ionicons 
                name="menu" 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              />
            </Pressable>
          ),
          // Add a direct profile access button that shows an alert with instructions
          headerRight: () => (
            <Pressable 
              onPress={() => {
                // Direct navigation to settings not working due to routing configuration
                // Show an instructional alert instead
                alert('To access your profile:\n1. Use the burger menu\n2. Then tap "Settings"\n3. Then tap "User Profile"');
              }} 
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="help-circle" 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              />
            </Pressable>
          ),
          // headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <Ionicons size={24} name="chatbubbles" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <Ionicons size={24} name="paper-plane" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <Ionicons size={24} name="grid" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

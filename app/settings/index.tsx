import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  
  const handleBack = () => {
    // Navigate back to tabs
    try {
      router.push({
        pathname: '/(tabs)',
      } as any);
    } catch (err) {
      const error = err as Error;
      console.error('Error navigating back:', error);
      Alert.alert("Navigation Error", "Could not navigate back. Please try again.");
    }
  };
  
  const handleUserProfilePress = () => {
    // Navigate to user profile
    try {
      router.push({
        pathname: '/settings/user-profile',
      } as any);
    } catch (err) {
      const error = err as Error;
      console.error('Error navigating to user profile:', error);
      Alert.alert("Navigation Error", "Could not navigate to User Profile. Please try again.");
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Settings',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ marginLeft: 8 }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        }} 
      />
      
      <ThemedView style={styles.container}>
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleUserProfilePress}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person" 
              size={22} 
              color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint} 
            />
          </View>
          <View style={styles.settingTextContainer}>
            <ThemedText style={styles.settingText}>User Profile</ThemedText>
            <ThemedText style={styles.settingDescription}>Manage your personal information</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        {/* Additional settings options */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="notifications" 
              size={22} 
              color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint} 
            />
          </View>
          <View style={styles.settingTextContainer}>
            <ThemedText style={styles.settingText}>Notifications</ThemedText>
            <ThemedText style={styles.settingDescription}>Manage your notification preferences</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="lock-closed" 
              size={22} 
              color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint} 
            />
          </View>
          <View style={styles.settingTextContainer}>
            <ThemedText style={styles.settingText}>Privacy & Security</ThemedText>
            <ThemedText style={styles.settingDescription}>Manage privacy and security settings</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
}); 
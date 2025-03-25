import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';

export default function UserProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Get user profile data from store
  const { profile, updateProfile } = useUserStore();
  
  // State for form fields
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [preferences, setPreferences] = useState(profile.preferences);
  
  // Handle form submission
  const handleUpdateProfile = () => {
    // Update the store with the new values
    updateProfile({
      firstName,
      lastName,
      email,
      preferences
    });
    
    console.log('Profile updated!', { firstName, lastName, email, preferences });
    // Show confirmation to user
    alert('Profile updated successfully!');
  };
  
  // Handle back navigation - go to settings screen or back if available
  const handleBack = () => {
    try {
      // Navigate back to settings
      router.push({
        pathname: '/settings',
      } as any);
    } catch (err) {
      const error = err as Error;
      console.error('Navigation error:', error);
      alert('Could not navigate back. Please try again.');
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'User Profile',
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
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <ThemedView style={styles.container}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    borderColor: colorScheme === 'dark' ? '#555' : '#e0e0e0'
                  }
                ]}
                placeholder="Enter first name"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    borderColor: colorScheme === 'dark' ? '#555' : '#e0e0e0'
                  }
                ]}
                placeholder="Enter last name"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    borderColor: colorScheme === 'dark' ? '#555' : '#e0e0e0'
                  }
                ]}
                placeholder="Enter email"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>
                What personal preferences should be considered in responses?
              </ThemedText>
              <TextInput
                style={[
                  styles.textarea,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                    borderColor: colorScheme === 'dark' ? '#555' : '#e0e0e0'
                  }
                ]}
                placeholder="Enter your preferences"
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#999'}
                value={preferences}
                onChangeText={setPreferences}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.updateButton,
                { backgroundColor: Colors[colorScheme].tint }
              ]} 
              onPress={handleUpdateProfile}
            >
              <ThemedText style={styles.updateButtonText}>Update Profile</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
  },
  updateButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
import React from 'react';
import { Image, StyleSheet, Platform, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { profile } = useUserStore();
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/Mosaic_SAB_banner.jpg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hello, {profile.firstName}!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="subtitle" style={styles.welcomeTitle}>
          Welcome to Mosaic AI Assistant
        </ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>
          Your AI-powered business companion is ready to help.
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Get started with:
        </ThemedText>
        
        <ThemedView style={styles.featureList}>
          <ThemedText style={styles.featureItem}>• Quick answers to business questions</ThemedText>
          <ThemedText style={styles.featureItem}>• Interactive responses to surveys</ThemedText>
          <ThemedText style={styles.featureItem}>• Document analysis and summaries</ThemedText>
          <ThemedText style={styles.featureItem}>• Data visualization and reporting</ThemedText>
        </ThemedView>

        <ThemedText style={styles.chatPrompt}>
          Tap the "Chat" button on the navigation tab below to begin your conversation.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  welcomeContainer: {
    gap: 16,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureList: {
    gap: 12,
    marginLeft: 8,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 24,
  },
  chatPrompt: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  assistancePrompt: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  marginTop: {
    marginTop: 16,
  },
  reactLogo: {
    height: 250,
    width: 500,
    bottom: 0,
    left: 0,
    position: 'absolute',
  }
});

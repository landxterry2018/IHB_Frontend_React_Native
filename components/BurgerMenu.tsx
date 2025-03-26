import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Modal, Pressable, Dimensions, Linking } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface BurgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ isVisible, onClose }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset the expanded state when menu closes
      setIsSettingsExpanded(false);
    }
  }, [isVisible, slideAnim, fadeAnim]);

  const handleHomePress = () => {
    onClose();
    router.navigate('/(tabs)');
  };

  const handleChatPress = () => {
    onClose();
    router.navigate('/(tabs)/chat');
  };

  const handleExplorePress = () => {
    onClose();
    router.navigate('/(tabs)/explore');
  };

  const handleInsightPress = () => {
    onClose();
    setTimeout(() => {
      try {
        router.push({
          pathname: 'insight',
        } as any);
      } catch (err) {
        const error = err as Error;
        console.error('Navigation error:', error);
        alert('Could not navigate to Insight. Please try again.');
      }
    }, 100);
  };

  const handleSettingsPress = () => {
    // Toggle the settings expanded state
    setIsSettingsExpanded(!isSettingsExpanded);
  };

  const navigateToSettings = () => {
    onClose();
    // Navigate to the settings page
    setTimeout(() => {
      try {
        router.push({
          pathname: 'settings/index',
        } as any);
      } catch (err) {
        const error = err as Error;
        console.error('Navigation error:', error);
        alert('Could not navigate to Settings. Please try again.');
      }
    }, 100);
  };

  const navigateToUserProfile = () => {
    onClose();
    // Navigate to user profile
    setTimeout(() => {
      try {
        router.push({
          pathname: 'settings/user-profile',
        } as any);
      } catch (err) {
        const error = err as Error;
        console.error('Navigation error:', error);
        alert('Could not navigate to User Profile. Please try again.');
      }
    }, 100);
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="none">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
              backgroundColor: 'black',
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText style={styles.headerText} type="title">Menu</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={colorScheme === 'dark' ? 'white' : 'black'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {/* Home menu item */}
            <TouchableOpacity style={styles.menuItem} onPress={handleHomePress}>
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="home"
                    size={24}
                    color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                  />
                </View>
                <ThemedText style={styles.menuItemText}>Home</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Chat menu item */}
            <TouchableOpacity style={styles.menuItem} onPress={handleChatPress}>
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="chatbubbles"
                    size={24}
                    color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                  />
                </View>
                <ThemedText style={styles.menuItemText}>Chat</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Explore menu item */}
            <TouchableOpacity style={styles.menuItem} onPress={handleExplorePress}>
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="paper-plane"
                    size={24}
                    color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                  />
                </View>
                <ThemedText style={styles.menuItemText}>Explore</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Insight menu item */}
            <TouchableOpacity style={styles.menuItem} onPress={handleInsightPress}>
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="analytics"
                    size={24}
                    color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                  />
                </View>
                <ThemedText style={styles.menuItemText}>Insight</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Settings with expandable sub-menu */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleSettingsPress}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="settings"
                    size={24}
                    color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                  />
                </View>
                <ThemedText style={styles.menuItemText}>Settings</ThemedText>
              </View>
              <Ionicons
                name={isSettingsExpanded ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
              />
            </TouchableOpacity>

            {/* Settings sub-menu items - only shown when expanded */}
            {isSettingsExpanded && (
              <View style={styles.subMenuContainer}>
                <TouchableOpacity 
                  style={styles.subMenuItem} 
                  onPress={navigateToUserProfile}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                    />
                  </View>
                  <ThemedText style={styles.menuItemText}>User Profile</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="notifications"
                      size={20}
                      color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                    />
                  </View>
                  <ThemedText style={styles.menuItemText}>Notifications</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.subMenuItem}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
                    />
                  </View>
                  <ThemedText style={styles.menuItemText}>Privacy & Security</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Direct access section */}
            <View style={styles.directAccessSection}>
              <ThemedText style={styles.directAccessTitle}>Quick Access</ThemedText>
              
              <TouchableOpacity 
                style={[styles.directAccessButton, { backgroundColor: Colors[colorScheme].tint }]}
                onPress={navigateToUserProfile}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="person"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <ThemedText style={styles.directAccessButtonText}>User Profile</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropPressable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    paddingTop: 50, // To account for the status bar
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItems: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    width: '100%',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
  },
  directAccessSection: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 5,
  },
  directAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  directAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 5,
  },
  directAccessButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  subMenuContainer: {
    marginLeft: 40,
    marginTop: 5,
    marginBottom: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 15,
    width: '80%',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
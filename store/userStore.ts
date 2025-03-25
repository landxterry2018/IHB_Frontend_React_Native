import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Define types for your user profile
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  preferences: string;
}

// Define the store's state and actions
interface UserState {
  profile: UserProfile;
  updateProfile: (updatedProfile: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

// Default profile data
const DEFAULT_PROFILE: UserProfile = {
  firstName: 'Xu',
  lastName: 'Liu',
  email: 'xu.liu@mosaicco.com',
  preferences: 'When learning new concepts, I found analogies particularly helpful.'
};

// Create the store with persistence
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      updateProfile: (updatedProfile) => set((state) => ({
        profile: { ...state.profile, ...updatedProfile }
      })),
      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 
// store/chatStore.ts
import { create } from 'zustand'

// Define types for your message structure
interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;  // Optional, if you're handling audio messages
}

// Define the store's state and actions
interface PilotChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const usePilotChatStore = create<PilotChatState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  clearMessages: () => set({ messages: [] }),
}));
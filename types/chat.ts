// types/chat.ts
export interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  type: 'user' | 'bot';
  timestamp: string;
  error?: boolean;
  tableData?: {
    id: string;
    data: any;
  }[];
  metadata?: {
    question_id?: string;
    completed?: boolean;
  };
}
  
export interface ConversationHistory {
  role: string;
  content: string;
  timestamp: string;
}
  
export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error' | 'table';
  content: string | { id: string; data: any };
  done: boolean;
  message_id?: number;
}
  
export interface StreamComplete {
  question_id: string;
  completed: boolean;
}
  
export type OnChunkCallback = (chunk: string) => void;
export type OnCompleteCallback = (metadata: StreamComplete) => void;
export type OnErrorCallback = (error: Error) => void;
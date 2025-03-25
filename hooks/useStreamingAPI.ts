// hooks/useStreamingAPI.ts
import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { ConversationHistory, OnChunkCallback, OnCompleteCallback, OnErrorCallback, StreamChunk } from '@/types/chat';

const API_URL = Platform.select({
  ios: 'http://192.168.1.106:8000',
  web: 'http://localhost:8000',
  default: 'http://localhost:8000'
});

export const useStreamingAPI = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamResponse = async (
    message: string,
    history: ConversationHistory[],
    onChunk: OnChunkCallback,
    onComplete: OnCompleteCallback,
    onError: OnErrorCallback
  ): Promise<void> => {
    try {
      // Clean up any existing requests
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://192.168.1.106:8000/api/v1/chat/survey/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message,
          conversation_history: history
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (delimited by \n\n)
        while (buffer.includes('\n\n')) {
          const eventEndIndex = buffer.indexOf('\n\n');
          const eventData = buffer.slice(0, eventEndIndex);
          buffer = buffer.slice(eventEndIndex + 2);

          // Handle SSE data format
          if (eventData.startsWith('data: ')) {
            const jsonString = eventData.slice(6).trim();
            try {
              const data = JSON.parse(jsonString) as StreamChunk;
              
              switch(data.type) {
                case 'chunk':
                  onChunk(data.content);
                  break;
                case 'complete':
                  onComplete(data.content);  // Already parsed JSON from backend
                  break;
                case 'error':
                  onError(new Error(data.content));
                  break;
              }
            } catch (parseError) {
              console.error('SSE parse error:', parseError);
              onError(new Error('Failed to parse server response'));
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        console.warn('Unprocessed buffer content:', buffer);
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError(error instanceof Error ? error : new Error('Unknown error occurred'));
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return { streamResponse };
};
// app/(tabs)/chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Message } from '@/types/chat';
import TableView from '@/app/components/TableView';

// AssemblyAI Configuration
const ASSEMBLY_AI_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_ASSEMBLY_AI_API_KEY || '',
  UPLOAD_URL: 'https://api.assemblyai.com/v2/upload',
  TRANSCRIPT_URL: 'https://api.assemblyai.com/v2/transcript'
};

// WebSocket Configuration
const WS_CONFIG = {
  BASE_URL: Platform.select({
    ios: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000',
    android: process.env.EXPO_PUBLIC_WS_URL || 'ws://10.0.2.2:8000',
    web: 'ws://localhost:8000',
    default: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000'
  }),
  ENDPOINT: '/api/v1/chat/ws',
  RETRY_TIMEOUT: 3000,
  MAX_RETRIES: 5
};

const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// Welcome message for the chat
const WELCOME_MESSAGE = "Hello! I'm a multi-purpose AI assistant at Mosaic. \n\nI'm currently capable of:\n1) helping you record a safety observation \n2) capture contextual info related to variances between actual and planned production volumes \n3) answering questions regarding key financial metrics \n\nHow can I help you today?";

export default function Chat() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messageCounter = useRef(1);
  const firstChunkRef = useRef(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const websocketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  // const maxReconnectAttempts = WS_CONFIG.MAX_RETRIES;

  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recording = useRef<Audio.Recording | MediaRecorder | null>(null);

  const handleStreamError = (error: unknown, userMessageID?: number) => {
    setIsTyping(false);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (userMessageID) {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageID
          ? { ...msg, text: `Error: ${errorMessage}`, error: true }
          : msg
      ));
    }
    
    Alert.alert('Error', errorMessage);
  };

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHeartbeat = () => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Start new heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          // websocketRef.current.send(JSON.stringify({ type: 'ping' }));
          // Use a valid ping message type that the backend accepts
          websocketRef.current.send(JSON.stringify({
            type: "ping" 
          }));

        } catch (error) {
          console.log('Heartbeat failed, reconnecting...');

          setIsConnected(false)
          connectWebSocket();
        }
      } else {
        console.log('Connection lost, reconnecting...');
        connectWebSocket();
      }
    }, HEARTBEAT_INTERVAL);
  };

  const connectWebSocket = () => {
    // Close existing connection if any
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Create new WebSocket connection
    try{ 
      websocketRef.current = new WebSocket(`${WS_CONFIG.BASE_URL}${WS_CONFIG.ENDPOINT}`);
      
      websocketRef.current.onopen = () => {
        console.log('WebSocket Connected');
        startHeartbeat(); // Start heartbeat when connection opens
        setIsConnected(true);
        // reconnectAttempts.current = 0; // Reset attempts on successful connection
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch(data.type) {
            case 'chunk':
              if (firstChunkRef.current) {
                // For first chunk, create new bot message
                const botMessage: Message = {
                  id: data.message_id,
                  role: 'assistant',
                  text: data.content, // Include the first chunk content
                  type: 'bot',
                  timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, botMessage])
                firstChunkRef.current = false;
              } else {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === data.message_id
                      ? { ...msg, text: msg.text + data.content }
                      : msg
                  )
                );
              }
              setIsTyping(false); // Keep typing indicator while receiving chunks
              break;
  
            case 'complete':
              setIsTyping(false);
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === data.message_id
                    ? { 
                        ...msg, 
                        metadata: {
                          question_id: data.content.question_id,
                          completed: data.content.completed
                        }
                      }
                    : msg
                )
              );
              break;
  
            case 'table':
              // Handle table data
              console.log('Received table data:', data.content);
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === data.message_id
                    ? { 
                        ...msg, 
                        tableData: msg.tableData 
                          ? [...msg.tableData, { 
                              id: data.content.id, 
                              data: data.content.data 
                            }] 
                          : [{ 
                              id: data.content.id, 
                              data: data.content.data 
                            }]
                      }
                    : msg
                )
              );
              break;
  
            case 'error':
              handleStreamError(new Error(data.content), data.message_id);
              break;
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      websocketRef.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setIsConnected(false);
        handleStreamError(error);
      };
  
      websocketRef.current.onclose = (event) => {
        console.log('WebSocket Disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Clear heartbeat on connection close
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        // Attempt immediate reconnection
        setTimeout(connectWebSocket, 100);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  };
  
  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: messageCounter.current,
      role: 'assistant',
      text: WELCOME_MESSAGE,
      type: 'bot',
      timestamp: new Date().toISOString()
    }]);

    // Establish WebSocket connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  
    }, []);

  const getNextMessageID = () => ++messageCounter.current;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendStreaming = async (): Promise<void> => {
    if (!inputMessage.trim() || !websocketRef.current) return;

    const userMessageID = getNextMessageID();
    const botMessageID = getNextMessageID();

    const userMessage: Message = {
      id: userMessageID,
      role: 'user',
      text: inputMessage.trim(),
      type: 'user',
      timestamp: new Date().toISOString(),
    };

    setInputMessage('');
    setIsTyping(true);
    setMessages(prev => [...prev, userMessage]);
    firstChunkRef.current = true; // Reset firstChunk flag for new conversation
  
    await delay(250); 

    try {
      // Check WebSocket state and reconnect if needed
      if (!isConnected || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        console.log('WebSocket is not open, attempting to reconnect...');
        reconnectAttempts.current = 0; // Reset attempts for new connection
        connectWebSocket();
        
        // Wait for connection with timeout
        await new Promise<void>((resolve, reject) => {
          const checkConnection = setInterval(() => {
            if (websocketRef.current?.readyState === WebSocket.OPEN) {
              clearInterval(checkConnection);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkConnection);
            reject(new Error('Connection timeout'));
          }, 5000);
        });
      }
      
      if (websocketRef.current?.readyState === WebSocket.OPEN) {  
      websocketRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: userMessage.text,
        message_id: botMessageID,
        conversation_history: messages.map(msg => ({
          role: msg.role,
          content: msg.text,
          timestamp: msg.timestamp
        }))
      }));
    } else {
      throw new Error('Unable to establish connection');
    }
  }
  catch (error) {
    console.error('WebSocket send error:', error);
    handleStreamError(error, userMessageID);
    setIsTyping(false);}
};


  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = (message: Message) => (
    <View 
      key={message.id}
      style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.botMessage,
        message.error && styles.errorMessage
      ]}
    >
      {message.type === 'bot' && (
        <View style={styles.botIcon}>
          <MaterialIcons name="android" size={20} color="#fff" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        message.type === 'user' ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.type === 'user' ? styles.userText : styles.botText
        ]}>
          {message.text}
        </Text>
        
        {/* Render tables if they exist */}
        {message.tableData && message.tableData.length > 0 && (
          <View style={styles.tableContainer}>
            {message.tableData.map((table, index) => (
              <View key={`table-${table.id}-${index}`} style={styles.tableWrapper}>
                <TableView 
                  data={table.data} 
                  title={table.id} 
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Add pulse animation
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording]);

  // Initialize audio recording
  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (err) {
        console.error('Failed to get audio recording permissions:', err);
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      // Check if AssemblyAI API key is configured
      if (!ASSEMBLY_AI_CONFIG.API_KEY || ASSEMBLY_AI_CONFIG.API_KEY === 'your_api_key_here') {
        Alert.alert(
          'Configuration Error',
          'Please set up your AssemblyAI API key in the .env file',
          [{ text: 'OK' }]
        );
        return;
      }

      if (Platform.OS === 'web') {
        try {
          console.log('Starting web recording...');
          
          // Check if the browser supports getUserMedia
          if (!navigator?.mediaDevices?.getUserMedia) {
            console.error('getUserMedia not supported');
            Alert.alert(
              'Browser Not Supported',
              'Your browser does not support audio recording. Please try using Chrome.',
              [{ text: 'OK' }]
            );
            return;
          }

          // List available audio devices
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            console.log('Available audio devices:', audioDevices);

            if (audioDevices.length === 0) {
              Alert.alert(
                'No Microphone Found',
                'No audio input devices were detected. Please connect a microphone and try again.',
                [{ text: 'OK' }]
              );
              return;
            }
          } catch (enumError) {
            console.error('Failed to enumerate devices:', enumError);
          }

          // Get supported MIME types
          const mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : MediaRecorder.isTypeSupported('audio/ogg')
                ? 'audio/ogg'
                : null;

          if (!mimeType) {
            console.error('No supported MIME types found');
            Alert.alert(
              'Browser Not Supported',
              'Your browser does not support any compatible audio formats. Please try using Chrome.',
              [{ text: 'OK' }]
            );
            return;
          }

          console.log('Using MIME type:', mimeType);

          // Request microphone permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
              sampleRate: 44100,
            }
          });

          console.log('Got media stream:', stream);

          // Check if MediaRecorder is supported
          if (!window?.MediaRecorder) {
            console.error('MediaRecorder not supported');
            stream.getTracks().forEach(track => track.stop());
            Alert.alert(
              'Browser Not Supported',
              'Your browser does not support MediaRecorder. Please try using Chrome.',
              [{ text: 'OK' }]
            );
            return;
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 128000
          });
          
          console.log('MediaRecorder created:', mediaRecorder);
          const audioChunks: BlobPart[] = [];

          mediaRecorder.ondataavailable = (event) => {
            console.log('Data available:', event.data.size);
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event);
            Alert.alert('Error', 'Recording error occurred. Please try again.');
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
          };

          mediaRecorder.onstop = async () => {
            console.log('MediaRecorder stopped');
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            console.log('Audio blob created:', audioBlob.size, 'bytes');
            
            setIsRecording(false);
            setIsTranscribing(true);

            try {
              console.log('Uploading audio recording...');
              const uploadResponse = await fetch(ASSEMBLY_AI_CONFIG.UPLOAD_URL, {
                method: 'POST',
                headers: {
                  'authorization': ASSEMBLY_AI_CONFIG.API_KEY,
                  'content-type': 'application/octet-stream',
                },
                body: audioBlob,
              });

              if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status: ${uploadResponse.status}`);
              }

              const { upload_url } = await uploadResponse.json();
              console.log('Upload successful, URL:', upload_url);
              await transcribeAudio(upload_url);
            } catch (err) {
              console.error('Upload error:', err);
              Alert.alert('Error', 'Failed to upload audio. Please try again.');
              setIsTranscribing(false);
            } finally {
              // Cleanup
              stream.getTracks().forEach(track => track.stop());
              audioChunks.length = 0;
            }
          };

          // Start recording with 1-second timeslices
          mediaRecorder.start(1000);
          recording.current = mediaRecorder;
          setIsRecording(true);
          console.log('Web recording started successfully');
        } catch (err) {
          console.error('Failed to start web recording:', err);
          if (err instanceof DOMException) {
            console.log('DOMException name:', err.name);
            console.log('DOMException message:', err.message);
            
            if (err.name === 'NotAllowedError') {
              Alert.alert(
                'Permission Denied',
                'Please allow microphone access in your browser settings to use voice recording.',
                [{ text: 'OK' }]
              );
            } else if (err.name === 'NotFoundError') {
              Alert.alert(
                'No Microphone Found',
                'Please make sure you have a microphone connected to your device.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Recording Error',
                `Failed to start recording: ${err.message}`,
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'Recording Error',
              'Failed to start recording. Please check your microphone settings and try again.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        const { granted } = await Audio.getPermissionsAsync();
        if (!granted) {
          const { granted: newGranted } = await Audio.requestPermissionsAsync();
          if (!newGranted) {
            Alert.alert('Permission required', 'Please grant microphone access to record audio.');
            return;
          }
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recordingOptions: Audio.RecordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        };

        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(recordingOptions);
        await newRecording.startAsync();
        recording.current = newRecording;
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current) return;

      if (Platform.OS === 'web') {
        (recording.current as MediaRecorder).stop();
      } else {
        await (recording.current as Audio.Recording).stopAndUnloadAsync();
        const uri = (recording.current as Audio.Recording).getURI();
        recording.current = null;
        setIsRecording(false);

        if (uri) {
          setIsTranscribing(true);
          await transcribeAudio(uri);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setIsRecording(false);
    }
  };

  const uploadAudio = async (uri: string) => {
    try {
      console.log('Uploading audio file:', uri);
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(ASSEMBLY_AI_CONFIG.UPLOAD_URL, {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_CONFIG.API_KEY,
          'content-type': 'application/octet-stream',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      const { upload_url } = await uploadResponse.json();
      console.log('Audio uploaded successfully');
      return upload_url;
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error('Failed to upload audio file');
    }
  };

  const transcribeAudio = async (audioSource: string) => {
    try {
      console.log('Starting transcription process');
      let audioUrl = audioSource;
      
      // If it's a local URI (mobile), upload it first
      if (!audioSource.startsWith('http')) {
        audioUrl = await uploadAudio(audioSource);
      }

      const transcriptResponse = await fetch(ASSEMBLY_AI_CONFIG.TRANSCRIPT_URL, {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_CONFIG.API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en',
        }),
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Transcription request failed with status: ${transcriptResponse.status}`);
      }

      const { id } = await transcriptResponse.json();
      console.log('Transcription started with ID:', id);
      await pollTranscriptionResult(id);
    } catch (err) {
      console.error('Transcription error:', err);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

  const pollTranscriptionResult = async (transcriptId: string) => {
    try {
      console.log('Polling for transcription result');
      const pollingInterval = setInterval(async () => {
        const resultResponse = await fetch(
          `${ASSEMBLY_AI_CONFIG.TRANSCRIPT_URL}/${transcriptId}`,
          {
            headers: {
              'authorization': ASSEMBLY_AI_CONFIG.API_KEY,
            },
          }
        );

        if (!resultResponse.ok) {
          throw new Error(`Polling failed with status: ${resultResponse.status}`);
        }

        const result = await resultResponse.json();
        console.log('Polling status:', result.status);

        if (result.status === 'completed') {
          clearInterval(pollingInterval);
          setIsTranscribing(false);
          
          if (result.text) {
            console.log('Transcription completed:', result.text);
            setInputMessage(prev => 
              prev ? `${prev} ${result.text}` : result.text
            );
          }
        } else if (result.status === 'error') {
          clearInterval(pollingInterval);
          setIsTranscribing(false);
          throw new Error(`Transcription failed: ${result.error}`);
        }
      }, 1000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollingInterval);
        setIsTranscribing(false);
        console.log('Polling timeout reached');
      }, 300000);
    } catch (err) {
      console.error('Polling error:', err);
      Alert.alert('Error', 'Failed to get transcription results. Please try again.');
      setIsTranscribing(false);
    }
  };

  // Function to clear the chat
  const handleClearChat = () => {
    // Reset to initial welcome message
    setMessages([{
      id: getNextMessageID(),
      role: 'assistant',
      text: WELCOME_MESSAGE,
      type: 'bot',
      timestamp: new Date().toISOString()
    }]);
    
    // Clear input message
    setInputMessage('');
    
    // Reset first chunk ref
    firstChunkRef.current = true;
    
    // Scroll to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top - 5}
      >
        <View style={styles.container}>
          <View style={styles.messagesWrapper}>
            <TouchableOpacity
              style={[
                styles.clearButton,
                { opacity: messages.length > 1 ? 1 : 0.5 }
              ]}
              onPress={handleClearChat}
              disabled={messages.length <= 1}
            >
              <MaterialIcons name="add" size={24} color="#666" />
            </TouchableOpacity>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 90 }]}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}
              {isTyping && (
                <View style={styles.typingContainer}>
                  <View style={styles.botIcon}>
                    <MaterialIcons name="android" size={20} color="#fff" />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
  
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder={isTranscribing ? "Transcribing..." : "Type your message..."}
              multiline
              maxLength={1000}
              editable={!isTranscribing}
            />
            <TouchableOpacity
              style={styles.recordButton}
              onPress={toggleRecording}
              disabled={isTranscribing}>
              <Animated.View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonActive,
                  isTranscribing && styles.recordButtonDisabled,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}>
                <MaterialIcons
                  name={isRecording ? 'stop' : 'mic'}
                  size={24}
                  color={isTranscribing ? '#999' : isRecording ? '#FF4444' : '#666'}
                />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputMessage.trim() ? 1 : 0.5 },
              ]}
              onPress={handleSendStreaming}
              disabled={!inputMessage.trim() || isTranscribing}>
              <MaterialIcons name="send" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  keyboardView: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  clearIcon: {
    transform: [{ rotate: '45deg' }], // Transform + to make it an X
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesContent: {
    paddingTop: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#000',
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    minHeight: 60,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
  },
  recordButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  recordButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recordButtonActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4444',
  },
  recordButtonDisabled: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ccc',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  typingBubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  errorMessage: {
    backgroundColor: '#ffe5e5',
    borderColor: '#ffcccc',
    borderWidth: 1,
  },
  tableContainer: {
    marginTop: 12,
    marginBottom: 5,
    width: '100%',
  },
  tableWrapper: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
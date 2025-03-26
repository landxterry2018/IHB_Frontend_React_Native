import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

// HTML template that includes Vega and Vega-Lite libraries
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      margin: 0;
      padding: 10px;
      background-color: #FFFFFF;
    }
    #vis {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .dark-mode {
      background-color: #121212;
      color: white;
    }
  </style>
</head>
<body>
  <div id="vis"></div>

  <script>
    // Function to receive messages from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vega-lite-spec') {
          // Parse the Vega-Lite spec
          const spec = JSON.parse(data.spec);
          
          // Embed the visualization
          vegaEmbed('#vis', spec, {
            renderer: 'canvas', // Use 'canvas' or 'svg'
            actions: true // Show the actions menu
          }).catch(console.error);
        } else if (data.type === 'theme') {
          // Apply dark mode if needed
          if (data.darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    // Tell React Native we're ready
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
`;

// Default example of Vega-Lite code
const DEFAULT_VEGA_LITE_SPEC = `{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A simple bar chart with embedded data.",
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
      {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
      {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "b", "type": "quantitative"}
  }
}`;

// Function to render web platform visualization
const WebPlatformVisualization = ({ html }: { html: string }) => {
  // Create a blob URL for the HTML content
  const [blobUrl, setBlobUrl] = useState('');
  
  useEffect(() => {
    // Create a blob from HTML content and generate a URL
    if (typeof window !== 'undefined') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      
      // Clean up when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [html]);
  
  if (!blobUrl) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading visualization...</ThemedText>
      </View>
    );
  }

  return (
    <iframe
      src={blobUrl}
      style={{ 
        border: 'none', 
        width: '100%', 
        height: '100%',
        flex: 1
      }}
      title="Vega-Lite Visualization"
    />
  );
};

export default function InsightScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [vegaLiteCode, setVegaLiteCode] = useState(DEFAULT_VEGA_LITE_SPEC);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [injectedJavaScript, setInjectedJavaScript] = useState('');

  const handleBackPress = () => {
    router.back();
  };

  const handleRunCode = () => {
    try {
      // Parse the code to validate it's valid JSON
      JSON.parse(vegaLiteCode);
      
      // Create JavaScript to inject that will run the code
      const js = `
        (function() {
          try {
            const spec = ${vegaLiteCode};
            
            vegaEmbed('#vis', spec, {
              renderer: 'canvas',
              actions: true
            }).catch(console.error);
          } catch (error) {
            console.error('Error processing Vega-Lite spec:', error);
          }
        })();
        true;
      `;
      
      setInjectedJavaScript(js);
      // Force WebView to reload with new injected code
      setWebViewKey(prevKey => prevKey + 1);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid Vega-Lite JSON';
      Alert.alert('Error', `The code contains invalid JSON: ${errorMessage}`);
    }
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setIsWebViewReady(true);
      } else if (data.type === 'error') {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Generate the HTML with the theme and initial data
  const getHtmlWithData = () => {
    // Create the full HTML with the Vega-Lite spec embedded
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          margin: 0;
          padding: 10px;
          background-color: ${colorScheme === 'dark' ? '#121212' : '#FFFFFF'};
          color: ${colorScheme === 'dark' ? 'white' : 'black'};
        }
        #vis {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div id="vis"></div>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
          try {
            const spec = ${vegaLiteCode};
            
            vegaEmbed('#vis', spec, {
              renderer: 'canvas',
              actions: true
            }).catch(console.error);
          } catch (error) {
            console.error('Error processing Vega-Lite spec:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.message
            }));
          }
          
          // Tell React Native we're ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ready'
          }));
        });
      </script>
    </body>
    </html>
    `;
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Insight - Vega-Lite Visualizer',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Vega-Lite Visualizer</ThemedText>
        <ThemedText style={styles.subtitle}>
          Paste Vega-Lite JSON code and click Run to generate visualizations
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.codeContainer}>
        <ScrollView style={styles.codeScrollView}>
          <TextInput
            style={[
              styles.codeInput,
              { color: colorScheme === 'dark' ? '#E6E6E6' : '#333333' }
            ]}
            multiline
            value={vegaLiteCode}
            onChangeText={setVegaLiteCode}
            placeholder="Paste your Vega-Lite JSON here..."
            placeholderTextColor={colorScheme === 'dark' ? '#AAAAAA' : '#999999'}
          />
        </ScrollView>
        
        <TouchableOpacity 
          style={[styles.runButton, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={handleRunCode}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <ThemedText style={styles.runButtonText}>Run</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.visualizationContainer}>
        <ThemedText type="subtitle" style={styles.visualizationTitle}>Visualization</ThemedText>
        <View style={styles.webViewContainer}>
          {Platform.OS === 'web' ? (
            <WebPlatformVisualization html={getHtmlWithData()} />
          ) : (
            <WebView
              key={webViewKey}
              originWhitelist={['*']}
              source={{ html: getHtmlWithData() }}
              onMessage={handleWebViewMessage}
              style={styles.webView}
              scrollEnabled={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,  // Account for the header
  },
  backButton: {
    paddingHorizontal: 15,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  codeContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    flex: 0.4,  // Take 40% of available space
  },
  codeScrollView: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  codeInput: {
    fontFamily: 'Courier',
    fontSize: 14,
    minHeight: 100,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  visualizationContainer: {
    paddingHorizontal: 20,
    flex: 0.6,  // Take 60% of available space
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  webViewContainer: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
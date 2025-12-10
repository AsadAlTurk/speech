  import React, { useEffect, useState } from 'react';
  import { Button, Text, Alert, Platform, StyleSheet, View } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
  import { start, stop, subscribe } from 'react-native-rn-voicekit';

  export default function App() {
    const [transcribedText, setTranscribedText] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Request microphone permission
    const requestMicrophonePermission = async () => {
      try {
        const permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.MICROPHONE
            : PERMISSIONS.ANDROID.RECORD_AUDIO;

        const status = await check(permission);
        if (status === RESULTS.GRANTED) return true;

        const reqStatus = await request(permission);
        return reqStatus === RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    };

    useEffect(() => {
      // Subscribe to voice events
      const unsub = subscribe({
        onSpeechStart: () => setIsListening(true),
        onSpeechEnd: () => setIsListening(false),
        onSpeechPartialResults: (results) => setTranscribedText(results.join(' ')),
        onSpeechResults: (results) => {
          setTranscribedText(results.join(' '));
          setIsListening(false);
        },
        onSpeechError: (e) => {
          if (e.code === 'E_RECOG') {
            console.warn('No speech detected. Try speaking clearly.');
          } else if (e.code === 'E_MIC') {
            Alert.alert('Microphone Error', 'Please check microphone permissions.');
          } else {
            console.error('Speech Error:', e);
          }
          setIsListening(false);
        },
      });

      return () => unsub(); // Clean up on unmount
    }, []);

    const handleStartStop = async () => {
      try {
        if (!isListening) {
          const hasPermission = await requestMicrophonePermission();
          if (!hasPermission) {
            Alert.alert(
              'Permission required',
              'Microphone access is required to use voice recognition.'
            );
            return;
          }
          await start('fr-FR'); // You can change locale as needed
        } else {
          await stop();
        }
      } catch (error) {
        console.error('VoiceKit start/stop error:', error);
        setIsListening(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            title={isListening ? 'Stop Listening' : 'Start Listening'}
            onPress={handleStartStop}
          />
        </View>
        <Text style={styles.statusText}>
          {isListening ? '...Listening...' : 'Press Start to speak.'}
        </Text>
        <Text style={styles.transcribedText}>{transcribedText}</Text>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    buttonContainer: {
      marginVertical: 10,
    },
    statusText: {
      marginTop: 20,
      fontSize: 18,
    },
    transcribedText: {
      marginTop: 10,
      fontSize: 24,
      fontWeight: 'bold',
    },
  });

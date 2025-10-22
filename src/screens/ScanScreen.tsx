// HomeScreen.tsx
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {startRoomScan} from '../native/roomplan';

export default function ScanScreen() {
  const handleScan = async () => {
    try {
      const res = await startRoomScan();
      console.log('Scan result:', res);
      // you can now do something with the USDZ file
    } catch (e) {
      console.error('Scan failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Ready to Design Your Dream Home?</Text>
        <Text style={styles.subtitle}>
          Join us to save your styles and get personalized design inspiration.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signUpButton} onPress={handleScan}>
          <Text style={styles.signUpText}>Start Room Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // close to off-white in your image
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    marginTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  signUpButton: {
    backgroundColor: '#C9A56A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: '#C9A56A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function PromptLogin() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Ready to Design Your Dream Home?</Text>
        <Text style={styles.subtitle}>
          Join us to save your styles and get personalized design inspiration.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signUpButton}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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

/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, SafeAreaView, View, TouchableOpacity} from 'react-native';
import {styles} from '../styles/common';
import {useNavigation} from '@react-navigation/native';

function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Steps' as never);
  };
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.welcomeContainer}>
        <View style={styles.videoContainer}>
          <Text style={{color: 'black'}}>Video goes here</Text>
        </View>
        <Text style={styles.h1Text}>Welcome to All Things Snug!</Text>
        <Text style={styles.subText}>
          Visualize, Plan, and Transform Your Home with Ease.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;

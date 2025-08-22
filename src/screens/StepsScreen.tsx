/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {styles} from '../styles/common';
import {useNavigation} from '@react-navigation/native';

const stepsData = [
  {
    image: require('../../assets/images/step1.png'),
    title: 'Scan Your Space in Minutes',
    subtitle: 'Say Goodbye to Guesswork and Hello to Precise Planning',
    buttonText: 'Next',
  },
  {
    image: require('../../assets/images/step2.png'),
    title: 'Bring Your Existing Pieces to Life',
    subtitle:
      'Visualize How Your Beloved Items Will Fit In Your Redesigned Spaces.',
    buttonText: 'Next',
  },
  {
    image: require('../../assets/images/step2.png'),
    title: 'Bring Your Existing Pieces to Life',
    subtitle:
      'Visualize How Your Beloved Items Will Fit In Your Redesigned Spaces.',
    buttonText: 'Finish',
  },
];

export default function StepsScreen() {
  const [step, setStep] = useState(0);
  const navigation = useNavigation();

  const nextStep = () => {
    if (step < stepsData.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('PromptLogin' as never); // Final action
    }
  };

  const {image, title, subtitle, buttonText} = stepsData[step];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.welcomeContainer}>
        <View style={styles.videoContainer}>
          <Image
            source={image}
            style={{width: '100%', height: 350, borderRadius: 8}}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.h1Text}>{title}</Text>
        <Text style={styles.subText}>{subtitle}</Text>

        <TouchableOpacity style={styles.button} onPress={nextStep}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

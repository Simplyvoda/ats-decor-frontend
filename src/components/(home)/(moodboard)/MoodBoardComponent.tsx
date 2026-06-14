import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Heart} from 'lucide-react-native';
// import {useNavigation} from '@react-navigation/native';

const MoodBoardComponent = () => {
  // const navigation = useNavigation();

  // const navigateToMoodBoards = () => {
  //   navigation.navigate('Moodboards' as never);
  // };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        <Heart color={'#C1A36A'} size={20} /> Mood Board
      </Text>

      <View style={styles.emptyState}>
        <Heart size={40} />
        <Text style={styles.subtext}>
          See your favourite designs {'\n'} and inspirations
        </Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} disabled>
        <Text style={styles.ctaButtonText}>Coming Soon</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  title: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyState: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 15,
  },
  subtext: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#C1A36A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
    opacity: 0.7,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MoodBoardComponent;

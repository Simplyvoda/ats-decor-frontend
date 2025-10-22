import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Heart} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

const MoodBoardComponent = () => {
  const navigation = useNavigation();

  const navigateToMoodBoards = () => {
    navigation.navigate('Moodboards' as never);
  };

  return (
    <>
      <View style={styles.card}>
        <View>
          <Text style={styles.title}>
            <Heart color={'#C1A36A'} size={20} /> Mood Board
          </Text>

          <View
            style={{
              width: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginVertical: 15,
            }}>
            <Heart size={40} />
            <Text style={styles.subtext}>
              See your favourite designs and Inspirations
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={navigateToMoodBoards}>
            <Text style={styles.startButtonText}>View mood boards</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#C1A36A',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: 'CormorantGaramond-SemiBold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 30,
  },
  buttonContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#C1A36A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'transparent',
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
  subtext: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipsContainer: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  recentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: '#2C2C2C33',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  designItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  designImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  designInfo: {
    flex: 1,
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  designStyle: {
    fontSize: 14,
    color: '#999',
  },
  bookmarkIcon: {
    marginLeft: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeNavText: {
    color: '#D4A574',
  },
});

export default MoodBoardComponent;

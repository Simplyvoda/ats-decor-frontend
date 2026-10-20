import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Heart} from 'lucide-react-native';
import {makeStyles, useTheme} from '../../../theme/useTheme';
// import {useNavigation} from '@react-navigation/native';

const MoodBoardComponent = () => {
  const styles = useStyles();
  const {colors} = useTheme();
  // const navigation = useNavigation();

  // const navigateToMoodBoards = () => {
  //   navigation.navigate('Moodboards' as never);
  // };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        <Heart color={colors.brand} size={20} /> Mood Board
      </Text>

      <View style={styles.emptyState}>
        <Heart size={40} color={colors.icon} />
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

const useStyles = makeStyles(c => ({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 16,
    borderColor: c.border,
    borderWidth: 1,
  },
  title: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: c.textPrimary,
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
    color: c.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: c.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 10,
    opacity: 0.7,
  },
  ctaButtonText: {
    color: c.onBrand,
    fontSize: 16,
    fontWeight: '500',
  },
}));

export default MoodBoardComponent;

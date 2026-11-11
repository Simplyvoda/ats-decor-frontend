import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Heart} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {makeStyles, useTheme} from '../../../theme/useTheme';
import {navigateTo} from '../../../utils/navigation';

// Home tab card: the way into the Mood Board screen.
const MoodBoardComponent = () => {
  const styles = useStyles();
  const {colors} = useTheme();
  const navigation = useNavigation();

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Heart color={colors.brand} size={24} strokeWidth={1.5} />
        <Text style={styles.title}>Mood Board</Text>
      </View>

      <View style={styles.emptyState}>
        <Heart size={52} color={colors.textPrimary} strokeWidth={1.4} />
        <Text style={styles.subtext}>
          See your favourite designs{'\n'}and Inspirations
        </Text>
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigateTo(navigation, 'Moodboards')}>
        <Text style={styles.ctaButtonText}>View mood boards</Text>
      </TouchableOpacity>
    </View>
  );
};

const useStyles = makeStyles(c => ({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 40,
    borderRadius: 16,
    borderColor: c.border,
    borderWidth: 1,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 22},
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 24,
    fontWeight: '600',
    color: c.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    gap: 22,
    marginTop: 54,
    marginBottom: 34,
  },
  subtext: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'DM Sans',
    color: c.text,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  ctaButtonText: {
    fontFamily: 'DM Sans',
    color: c.onBrand,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
}));

export default MoodBoardComponent;

import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Clock, Home, LayoutPanelTop, LucideIcon} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {makeStyles} from '../../../theme/useTheme';
import {navigateTo} from '../../../utils/navigation';

type StudioCard = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  screen: string;
};

const CARDS: StudioCard[] = [
  {
    title: 'Recent Designs',
    subtitle: 'Pick up where you left off',
    icon: Clock,
    color: '#2C2C2C',
    screen: 'RecentDesigns',
  },
  {
    title: 'My Rooms',
    subtitle: 'Explore and manage your rooms',
    icon: Home,
    color: '#C1A36A',
    screen: 'MyRooms',
  },
  {
    title: 'Choose a template',
    subtitle: 'Choose a house model and start designing',
    icon: LayoutPanelTop,
    color: '#0E920E',
    screen: 'ChooseModel',
  },
];

// Home → Studio: the way into your designs, your saved rooms and templates.
const StudioComponent = () => {
  const navigation = useNavigation();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {CARDS.map(card => {
        const Icon = card.icon;
        return (
          <TouchableOpacity
            key={card.screen}
            style={styles.card}
            onPress={() => navigateTo(navigation, card.screen)}
            activeOpacity={0.8}
            accessibilityRole="button">
            <View style={[styles.strip, {backgroundColor: card.color}]}>
              <Icon size={18} color="#FFFFFF" />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.subtitle}>{card.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles(c => ({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    // padding: 16,
    gap: 20,
    // borderRadius: 24,
    // borderWidth: 1,
    // borderColor: c.border,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: c.surface,
    shadowColor: c.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  strip: {
    width: 22,
    height: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  text: {flex: 1},
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 20,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: c.text,
  },
}));

export default StudioComponent;

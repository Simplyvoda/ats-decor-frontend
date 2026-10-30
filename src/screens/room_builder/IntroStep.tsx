import {ChevronLeft, Lightbulb} from 'lucide-react-native';
import React from 'react';
import {Image, ImageBackground, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {makeStyles, useTheme} from '../../theme/useTheme';
import {PrimaryButton, SANS, SERIF, useStyles as useSharedStyles} from './ui';

// Placeholder photo until the one from the Figma design is exported into
// assets/images (swap the require below)
const HERO = require('../../../assets/images/step1.png');
const LOGO = require('../../../assets/images/pladomus_logo.png');

const TIPS = [
  'Choose Your Room Shape',
  'Enter Your Measurements',
  'Add Doors and Windows',
  'Preview Your Room in 2D/3D',
];

export default function IntroStep({onBack, onContinue}: {onBack: () => void; onContinue: () => void}) {
  const styles = useStyles();
  const shared = useSharedStyles();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        <ImageBackground source={HERO} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={[styles.heroShade, {paddingTop: insets.top + 12}]}>
            <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityLabel="Back">
              <ChevronLeft size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandText}>
                PLA<Text style={{color: colors.brand}}>DOMUS</Text>
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <Text style={shared.title}>Let’s build your room</Text>
          <Text style={shared.subtitle}>
            No scanning required, enter your room measurements to get started
          </Text>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Design Tips</Text>
            <Text style={styles.tipsLead}>Ready to design your next cozy space?</Text>
            {TIPS.map(tip => (
              <View key={tip} style={styles.tipRow}>
                <Lightbulb size={22} color={colors.brand} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, {paddingBottom: insets.bottom + 12}]}>
        <PrimaryButton label="Continue" onPress={onContinue} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  hero: {height: 260},
  // Curves away at the bottom right, like the design
  heroImage: {borderBottomRightRadius: 140, borderBottomLeftRadius: 24},
  heroShade: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomRightRadius: 140,
    borderBottomLeftRadius: 24,
  },
  brandRow: {flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginTop: 8},
  logo: {width: 36, height: 34, tintColor: '#FFFFFF'},
  brandText: {fontFamily: SERIF, fontSize: 20, color: '#FFFFFF', fontWeight: '600', letterSpacing: 1},
  body: {paddingHorizontal: 30, paddingTop: 32},
  tipsCard: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    padding: 22,
    gap: 14,
  },
  tipsTitle: {fontFamily: SERIF, fontSize: 26, color: c.textPrimary, fontWeight: '600'},
  tipsLead: {fontFamily: SANS, fontSize: 16, color: c.text, lineHeight: 22, marginBottom: 4},
  tipRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  tipText: {fontFamily: SANS, fontSize: 16, color: c.text},
  footer: {paddingHorizontal: 30, paddingTop: 8},
}));

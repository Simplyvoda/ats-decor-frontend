import React from 'react';
import {Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Rect, Stop, SvgXml} from 'react-native-svg';
import {makeStyles} from '../../theme/useTheme';
import {BACK_ICON, LOGO_HOUSE, TIP_BULB} from './figmaIcons';
import {PrimaryButton, SANS, SERIF, useStyles as useSharedStyles} from './ui';

// "Entry screen" in the PlaDomus Figma file (node 4126:2011)
const HERO = require('../../../assets/images/room_builder/intro_hero.png');

// The photo is 457 × 290 in the 393-wide design, hanging 32 px past the
// left edge and 58 px above the top, with 100 px rounded bottom corners.
// Only the part below the top edge (232 px) takes up room on the page.
const HERO_OVERHANG_X = 32;
const HERO_OVERHANG_TOP = 58;
const HERO_HEIGHT = 290;
const HERO_RADIUS = 100;

const BRAND_GOLD = '#C1A36A';

const TIPS = [
  'Choose Your Room Shape',
  'Enter Your Measurements',
  'Add Doors and Windows',
  'Preview Your Room in 2D/3D',
];

export default function IntroStep({onBack, onContinue}: {onBack: () => void; onContinue: () => void}) {
  const styles = useStyles();
  const shared = useSharedStyles();
  const insets = useSafeAreaInsets();
  const {width: screenWidth} = useWindowDimensions();
  const heroWidth = screenWidth + HERO_OVERHANG_X * 2;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.heroSlot}>
          <View style={[styles.hero, {width: heroWidth}]}>
            <Image source={HERO} style={styles.heroImage} resizeMode="cover" />
            {/* Two dark washes, then the gold-to-dark tints from the design */}
            <View style={[styles.wash, {backgroundColor: 'rgba(0,0,0,0.16)'}]} />
            <View style={[styles.wash, {backgroundColor: 'rgba(0,0,0,0.18)'}]} />
            <Svg style={styles.wash} width={heroWidth} height={HERO_HEIGHT}>
              <Defs>
                {/* CSS linear-gradient(-56deg, …) — runs from the bottom
                    right towards the top left */}
                <LinearGradient id="tint" x1="0.914" y1="0.78" x2="0.086" y2="0.22">
                  <Stop offset="0.355" stopColor="#000000" stopOpacity={0.375 * 0.63} />
                  <Stop offset="0.874" stopColor={BRAND_GOLD} stopOpacity={0.75 * 0.63} />
                </LinearGradient>
                {/* CSS linear-gradient(262deg, …) on the left part only */}
                <LinearGradient id="side" x1="0.995" y1="0.43" x2="0.005" y2="0.57">
                  <Stop offset="0.339" stopColor="#000000" stopOpacity={0.5 * 0.2} />
                  <Stop offset="0.909" stopColor={BRAND_GOLD} stopOpacity={0.2} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={1} width={heroWidth} height={HERO_HEIGHT} fill="url(#tint)" />
              <Rect x={-14} y={HERO_OVERHANG_TOP} width={314} height={226} fill="url(#side)" />
            </Svg>
          </View>

          <TouchableOpacity
            onPress={onBack}
            hitSlop={12}
            accessibilityLabel="Back"
            style={[styles.back, {top: insets.top + 40}]}>
            <SvgXml xml={BACK_ICON} />
          </TouchableOpacity>

          <View style={[styles.brandRow, {top: insets.top + 57}]} accessibilityLabel="PlaDomus">
            <View>
              <SvgXml xml={LOGO_HOUSE} />
              <Text style={styles.logoLetters}>
                P<Text style={{color: BRAND_GOLD}}>D</Text>
              </Text>
            </View>
            <Text style={styles.brandText}>
              PLA<Text style={{color: BRAND_GOLD}}>DOMUS</Text>
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={shared.title}>Let’s build your room</Text>
          <Text style={shared.subtitle}>
            No scanning required, enter your room measurement to get started
          </Text>

          <View style={styles.tipsCard}>
            <View style={styles.tipsHeading}>
              <Text style={styles.tipsTitle}>Design Tips</Text>
              <Text style={styles.tipsLead}>Ready to design your next cozy space?</Text>
            </View>
            <View style={styles.tipList}>
              {TIPS.map(tip => (
                <View key={tip} style={styles.tipRow}>
                  <SvgXml xml={TIP_BULB} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
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
  scroll: {paddingBottom: 24},
  heroSlot: {height: HERO_HEIGHT - HERO_OVERHANG_TOP},
  hero: {
    position: 'absolute',
    top: -HERO_OVERHANG_TOP,
    left: -HERO_OVERHANG_X,
    height: HERO_HEIGHT,
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
    overflow: 'hidden',
  },
  heroImage: {width: '100%', height: '100%'},
  wash: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  back: {position: 'absolute', left: 25},
  brandRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },
  // "PD" sits inside the house outline (9.5, 13 from its corner)
  logoLetters: {
    position: 'absolute',
    left: 9.5,
    top: 13,
    fontFamily: 'Cinzel-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  brandText: {fontFamily: 'Cinzel-Bold', fontSize: 16, color: '#FFFFFF', marginTop: 4},
  body: {paddingHorizontal: 30, paddingTop: 28},
  tipsCard: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    paddingHorizontal: 23,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 25,
  },
  tipsHeading: {gap: 9},
  tipsTitle: {fontFamily: SERIF, fontSize: 25, color: c.text, fontWeight: '600'},
  tipsLead: {fontFamily: SANS, fontSize: 16, color: c.text},
  tipList: {gap: 21},
  tipRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  tipText: {fontFamily: SANS, fontSize: 16, color: c.text},
  footer: {paddingHorizontal: 30, paddingTop: 8},
}));

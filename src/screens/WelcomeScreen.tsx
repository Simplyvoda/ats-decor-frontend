import {useNavigation} from '@react-navigation/native';
import React, {useRef, useState} from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {makeStyles, useTheme} from '../theme/useTheme';
import {navigateTo} from '../utils/navigation';

// Onboarding: "Splash Screen 25/26/27" in the PlaDomus Figma file
// (nodes 3989:603, 3989:637, 3989:673). Swipe or tap Next to move on;
// Skip and Get Started go to sign-in.

type Page = {image: ImageSourcePropType; title: string; subtitle: string};

const PAGES: Page[] = [
  {
    image: require('../../assets/images/onboarding/welcome.jpg'),
    title: 'Welcome to PlaDomus!',
    subtitle: 'Visualize, Plan, and Transform Your Home with Ease.',
  },
  {
    image: require('../../assets/images/onboarding/scan.jpg'),
    title: 'Scan Your Space in Minutes',
    subtitle: 'Say Goodbye to Guesswork and Hello to Precise Planning',
  },
  {
    image: require('../../assets/images/onboarding/pieces.jpg'),
    title: 'Bring Your Existing Pieces to Life',
    subtitle:
      'See how your existing furniture and décor can work in your space before making changes.',
  },
];

const LAST = PAGES.length - 1;

// The design is a 393 × 852 frame: 33 px side margins, a 327 × 439 photo
// (20 px corners) and the controls 50 px tall.
const SIDE = 33;
const PHOTO_RATIO = 439 / 327;

export default function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const styles = useStyles();
  const {isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const listRef = useRef<FlatList<Page>>(null);
  const [page, setPage] = useState(0);

  const photoWidth = width - SIDE * 2;
  // Keep the photo's shape, but let it shrink on short phones so the
  // text and buttons still fit (439 of the design's 852 px height)
  const photoHeight = Math.min(photoWidth * PHOTO_RATIO, height * 0.515);

  const finish = () => navigateTo(navigation, 'Auth', {screen: 'GetReady'});

  const next = () => {
    if (page < LAST) {
      listRef.current?.scrollToIndex({index: page + 1});
    } else {
      finish();
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.skipRow}>
        <TouchableOpacity onPress={finish} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={p => p.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({length: width, offset: width * index, index})}
        style={styles.list}
        renderItem={({item}) => (
          <View style={{width, paddingHorizontal: SIDE}}>
            <Image
              source={item.image}
              style={[styles.photo, {height: photoHeight}]}
              resizeMode="cover"
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* In the design the Next row ends 73 px above the bottom of the
          screen and the wider Get Started button 38 px (both including the
          34 px home-indicator area) */}
      <View
        style={[
          styles.footer,
          {paddingBottom: Math.max(insets.bottom, 20) + (page < LAST ? 39 : 4)},
        ]}>
        {page < LAST ? (
          <View style={styles.footerRow}>
            {/* One dot per page before the last, as in the design */}
            <View style={styles.dots}>
              {PAGES.slice(0, LAST).map((p, i) => (
                <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
            <TouchableOpacity
              onPress={next}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[styles.button, styles.nextButton]}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={finish}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 30,
    paddingTop: 4,
    paddingBottom: 18,
  },
  skip: {fontFamily: 'DM Sans', fontSize: 16, color: c.text, opacity: 0.5},
  list: {flexGrow: 0},
  photo: {width: '100%', borderRadius: 20},
  title: {
    fontFamily: 'Cormorant Garamond',
    fontWeight: '700',
    fontSize: 30,
    color: c.text,
    marginTop: 36,
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    lineHeight: 21,
    color: c.text,
    opacity: 0.7,
    marginTop: 10,
    maxWidth: 300,
  },
  footer: {flex: 1, justifyContent: 'flex-end', paddingHorizontal: 30},
  footerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  dots: {flexDirection: 'row', alignItems: 'center', gap: 7},
  dot: {width: 12, height: 7, borderRadius: 22, backgroundColor: `${c.brand}33`},
  dotActive: {width: 36, backgroundColor: c.brand},
  button: {
    height: 50,
    borderRadius: 10,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  nextButton: {width: 146},
  buttonText: {
    fontFamily: 'DM Sans',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.8,
    color: c.onBrand,
  },
}));

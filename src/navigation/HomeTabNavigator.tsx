import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {Compass, FileText, Home, PenTool, Settings} from 'lucide-react-native';

import DesignScreen from '../components/(design)/DesignScreen';
import ExploreScreen from '../components/(explore)/ExploreScreen';
import HomeScreen from '../screens/home_screens/InitialScreen';
import NotesScreen from '../components/(notes)/NotesScreen';
import UserAvatar from '../components/molecules/UserAvatar';
import GuidedTour, {
  Rect,
  TourStep,
} from '../components/shared/GuidedTour';
import WelcomeBackModal from '../components/shared/WelcomeBackModal';
import DesignService from '../services/DesignService';
import FurnitureService from '../services/FurnitureService';
import {IDesign} from '../../interface/design.interface';
import {
  describeLastActivity,
  formatActivityTime,
  latestDesign,
  openDesign,
} from '../utils/designs';
import {APP_TOUR} from '../config/tours';
import {useUserContext} from '../context/UserContext';
import {useTheme} from '../theme/useTheme';
import useAfterModalClose from '../hooks/useAfterModalClose';

const Tab = createBottomTabNavigator();

// The tour's highlight around a tab: wide enough for the longest label
// ("Explore"), and a little in from the top and bottom of the bar.
const TAB_HIGHLIGHT_WIDTH = 64;
const TAB_HIGHLIGHT_INSET = 2;

function TabHeader() {
  const navigation = useNavigation<any>();
  const {user} = useUserContext();
  const {isDark, colors} = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{backgroundColor: colors.surface}}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 8,
          backgroundColor: colors.surface,
        }}>
        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={() =>
            navigation.navigate('Settings', {screen: 'ProfilePreferences'})
          }
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <View style={{marginRight: 12}}>
            <UserAvatar
              profilePicture={user?.profile_picture}
              firstName={user?.first_name}
              lastName={user?.last_name}
              email={user?.email}
              size={40}
            />
          </View>
          <View>
            <Text style={{color: colors.textMuted, fontSize: 12}}>
              Welcome!
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: '600',
              }}>
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : (user?.email ?? '')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          onPress={() => navigation.navigate('Settings')}>
          <Settings size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// The tabs, left to right, as they appear in the tab bar.
const TABS = ['Home', 'Design', 'Notes', 'Explore'];

type WelcomeBack = {
  design: IDesign;
  lastActivity: string;
  when: string;
};

export default function HomeTabNavigator() {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {user, completeTour} = useUserContext();
  // Skipping hides the tour until the app is next opened.
  const [skipped, setSkipped] = useState(false);
  const showTour = user?.first_login_completed === false && !skipped;

  // ── Tour: highlight the tab button each step is about ──
  // The screen stays where it is; changing tabs under the tour's popup
  // doesn't work reliably on iOS.
  const window = useWindowDimensions();
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const [tourTarget, setTourTarget] = useState<string | undefined>();

  const onTourStep = (step: TourStep) => setTourTarget(step.target);
  const endTour = () => setTourTarget(undefined);

  // The tab bar runs along the bottom of the screen, full width, and its
  // buttons share that width equally. Its height includes the
  // home-indicator strip below the buttons, which is left out. Only the
  // icon and label in the middle of the button are highlighted, not the
  // whole (wide) button.
  const tabIndex = tourTarget ? TABS.indexOf(tourTarget) : -1;
  const buttonWidth = window.width / TABS.length;
  const highlightWidth = Math.min(TAB_HIGHLIGHT_WIDTH, buttonWidth);
  const highlight: Rect | null =
    tabBarHeight > 0 && tabIndex >= 0
      ? {
          x: buttonWidth * tabIndex + (buttonWidth - highlightWidth) / 2,
          y: window.height - tabBarHeight + TAB_HIGHLIGHT_INSET,
          width: highlightWidth,
          height: tabBarHeight - insets.bottom - TAB_HIGHLIGHT_INSET * 2,
        }
      : null;

  // ── Welcome back: returning users see their latest design ──
  // Decided once, when we first know whether they've done the tour, so
  // finishing the tour doesn't bring this up straight afterwards.
  const [isReturning, setIsReturning] = useState<boolean | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<WelcomeBack | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const afterWelcomeClose = useAfterModalClose();

  useEffect(() => {
    if (isReturning === null && user?.first_login_completed !== undefined) {
      setIsReturning(user.first_login_completed);
    }
  }, [isReturning, user?.first_login_completed]);

  useEffect(() => {
    if (!isReturning) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const design = latestDesign((await DesignService.getDesigns()).data);
        if (!design) {
          return;
        }
        // The catalogue only names the last piece added; carry on without it.
        const catalogue = await FurnitureService.getFurniture()
          .then(res => res.data)
          .catch(() => []);
        if (!cancelled) {
          setWelcomeBack({
            design,
            lastActivity: describeLastActivity(design, catalogue),
            when: formatActivityTime(design.updatedAt),
          });
          setWelcomeOpen(true);
        }
      } catch (err: any) {
        console.warn('Could not load latest design:', err?.message ?? err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReturning]);

  return (
    <>
      <Tab.Navigator
        tabBar={props => (
          <View
            onLayout={e => setTabBarHeight(e.nativeEvent.layout.height)}>
            <BottomTabBar {...props} />
          </View>
        )}
        screenOptions={({route}) => ({
          header: () => <TabHeader />,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 2,
          },
          tabBarIcon: ({color, size}) => {
            switch (route.name) {
              case 'Home':
                return <Home size={size} color={color} />;
              case 'Design':
                return <PenTool size={size} color={color} />;
              case 'Notes':
                return <FileText size={size} color={color} />;
              case 'Explore':
                return <Compass size={size} color={color} />;
              default:
                return null;
            }
          },
        })}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Design" component={DesignScreen} />
        <Tab.Screen name="Notes" component={NotesScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
      </Tab.Navigator>
      <GuidedTour
        visible={showTour}
        steps={APP_TOUR}
        highlight={highlight}
        onStepChange={onTourStep}
        onFinish={() => {
          endTour();
          completeTour('first_login_completed');
        }}
        onSkip={() => {
          endTour();
          setSkipped(true);
        }}
      />
      <WelcomeBackModal
        visible={welcomeOpen}
        designName={welcomeBack?.design.name ?? ''}
        lastActivity={welcomeBack?.lastActivity ?? ''}
        when={welcomeBack?.when ?? ''}
        onClose={() => setWelcomeOpen(false)}
        onDismiss={afterWelcomeClose.onDismiss}
        // Opens the design once the popup has closed
        onContinue={() => {
          const design = welcomeBack?.design;
          setWelcomeOpen(false);
          if (design) {
            afterWelcomeClose.run(() => openDesign(navigation, design));
          }
        }}
      />
    </>
  );
}

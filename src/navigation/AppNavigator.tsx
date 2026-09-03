import React, {useEffect} from 'react';
import {View} from 'react-native';
import BootSplash from 'react-native-bootsplash';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import StepsScreen from '../screens/StepsScreen';
import ViewMoodboards from '../screens/home_screens/moodboards/ViewMoodboards';
import SignUp from '../screens/auth_screens/SignUp';
import SetPassword from '../screens/auth_screens/SetPassword';
import ForgotPassword from '../screens/auth_screens/ForgotPassword';
import GetReady from '../screens/auth_screens/GetReady';
import Login from '../screens/auth_screens/Login';
import PrivacyPolicyScreen from '../screens/legal_screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/legal_screens/TermsOfServiceScreen';
import SettingsScreen from '../screens/settings_screens/InitialScreen';
import ProfilePreference from '../screens/settings_screens/ProfilePreference';
import Shopping from '../screens/settings_screens/Shopping';
import SecurityPrivacy from '../screens/settings_screens/SecurityPrivacy';
import HelpFeedback from '../screens/settings_screens/HelpFeedback';
import ScanScreen from '../screens/ScanScreen';
import ChooseModelScreen from '../screens/ChooseModelScreen';
import ARViewerScreen from '../screens/ARViewerScreen';
import BlogPostScreen from '../screens/home_screens/blog/BlogPostScreen';
import CreateNoteScreen from '../components/(notes)/CreateNoteScreen';
import DesignNotesScreen from '../components/(notes)/DesignNotesScreen';
import HomeTabNavigator from './HomeTabNavigator';
import {useUserContext} from '../context/UserContext';

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false}}>
      <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <SettingsStack.Screen
        name="ProfilePreferences"
        component={ProfilePreference}
      />
      <SettingsStack.Screen name="Shopping" component={Shopping} />
      <SettingsStack.Screen
        name="SecurityPrivacy"
        component={SecurityPrivacy}
      />
      <SettingsStack.Screen name="HelpFeedback" component={HelpFeedback} />
    </SettingsStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="SignUp" component={SignUp} />
      <AuthStack.Screen name="GetReady" component={GetReady} />
      <AuthStack.Screen name="SetPassword" component={SetPassword} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator(): React.JSX.Element {
  const {user, isLoadingUser} = useUserContext();

  useEffect(() => {
    if (!isLoadingUser) {
      BootSplash.hide({fade: true});
    }
  }, [isLoadingUser]);

  if (isLoadingUser) {
    return <View style={{flex: 1, backgroundColor: '#FAF9F6'}} />;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {user ? (
        // ── Authenticated ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="HomeTabs" component={HomeTabNavigator} />
          {/* Full-screen flows pushed on top of the tab bar */}
          <Stack.Screen name="ScanScreen" component={ScanScreen} />
          <Stack.Screen name="ChooseModel" component={ChooseModelScreen} />
          <Stack.Screen name="ARViewer" component={ARViewerScreen} />
          <Stack.Screen name="Settings" component={SettingsNavigator} />
          <Stack.Screen name="Moodboards" component={ViewMoodboards} />
          <Stack.Screen name="BlogPost" component={BlogPostScreen} />
          <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
          <Stack.Screen name="DesignNotes" component={DesignNotesScreen} />
        </>
      ) : (
        // ── Unauthenticated ────────────────────────────────────────────────
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Steps" component={StepsScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default AppNavigator;

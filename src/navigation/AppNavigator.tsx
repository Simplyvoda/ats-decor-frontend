import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import StepsScreen from '../screens/StepsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ScanScreen from '../screens/ScanScreen';
import HomeScreen from '../screens/home_screens/HomeScreen';
import ViewMoodboards from '../screens/home/moodboards/ViewMoodboards';
import SignUp from '../screens/auth_screens/SignUp';
import SetPassword from '../screens/auth_screens/SetPassword';
import ForgotPassword from '../screens/auth_screens/ForgotPassword';
import GetReady from '../screens/auth_screens/GetReady';
import Login from '../screens/auth_screens/Login';
import SettingsScreen from '../screens/settings_screens/InitialScreen';
import ProfilePreference from '../screens/settings_screens/ProfilePreference';
import Shopping from '../screens/settings_screens/Shopping';
import SecurityPrivacy from '../screens/settings_screens/SecurityPrivacy';
import HelpFeedback from '../screens/settings_screens/HelpFeedback';

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();


// Main app flow navigator
function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false}}>
      <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <SettingsStack.Screen name="ProfilePreferences" component={ProfilePreference} />
      <SettingsStack.Screen name="Shopping" component={Shopping} />
      <SettingsStack.Screen name="SecurityPrivacy" component={SecurityPrivacy} />
      <SettingsStack.Screen name="HelpFeedback" component={HelpFeedback} />
      {/* <SettingsStack.Screen name="ScanScreen" component={ScanScreen} />
      <SettingsStack.Screen name="Moodboards" component={ViewMoodboards} /> */}
    </SettingsStack.Navigator>
  );
}

function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName="Settings">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="GetReady" component={GetReady} />
      <Stack.Screen name="SetPassword" component={SetPassword} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ScanScreen" component={ScanScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Moodboards" component={ViewMoodboards} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
    </Stack.Navigator>
  );
}

export default AppNavigator;

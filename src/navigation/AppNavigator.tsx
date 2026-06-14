import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import StepsScreen from '../screens/StepsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ScanScreen from '../screens/ScanScreen';
// import HomeScreen from '../screens/home_screens/HomeScreen';
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
// import DesignScreen from '../screens/home_screens/DesignScreen';
// import ExploreScreen from '../screens/home_screens/ExploreScreen';
// import NotesScreen from '../screens/home_screens/NotesScreen';
import HomeLayout from '../screens/home_screens/InitialScreen';


const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
// const MainHomeStack = createNativeStackNavigator();

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
    </AuthStack.Navigator>
  );
}

// function MainNavigator() {
//   return (
//     <MainHomeStack.Navigator screenOptions={{headerShown: false}}>
//       <MainHomeStack.Screen name="Home" component={HomeScreen} />
//       <MainHomeStack.Screen name="Design" component={DesignScreen} />
//       <MainHomeStack.Screen name="Explore" component={ExploreScreen} />
//       <MainHomeStack.Screen name="Notes" component={NotesScreen} />
//     </MainHomeStack.Navigator>
//   );
// }

function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="ScanScreen" component={ScanScreen} />
      <Stack.Screen name="Moodboards" component={ViewMoodboards} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
      <Stack.Screen name="HomeScreen" component={HomeLayout} />
    </Stack.Navigator>
  );
}

export default AppNavigator;

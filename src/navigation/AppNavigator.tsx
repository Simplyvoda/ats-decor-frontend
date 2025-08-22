import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import StepsScreen from '../screens/StepsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PromptLogin from '../screens/PromptLogin';

const Stack = createNativeStackNavigator();

function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="PromptLogin" component={PromptLogin} />
    </Stack.Navigator>
  );
}

export default AppNavigator;

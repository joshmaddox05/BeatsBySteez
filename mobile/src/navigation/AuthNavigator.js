import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpRoleScreen from '../screens/auth/SignUpRoleScreen';
import CoachSignUpScreen from '../screens/auth/CoachSignUpScreen';
import CheerleaderSignUpScreen from '../screens/auth/CheerleaderSignUpScreen';
import ParentSignUpScreen from '../screens/auth/ParentSignUpScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="SignUpRole" component={SignUpRoleScreen} />
    <Stack.Screen name="CoachSignUp" component={CoachSignUpScreen} />
    <Stack.Screen name="CheerleaderSignUp" component={CheerleaderSignUpScreen} />
    <Stack.Screen name="ParentSignUp" component={ParentSignUpScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;

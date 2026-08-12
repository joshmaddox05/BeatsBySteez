import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { authStyles as s } from './authStyles';

const SignUpRoleScreen = ({ navigation }) => (
  <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.scroll}>
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.title}>I am a...</Text>
      <Text style={s.subtitle}>Choose your role to create an account</Text>

      <TouchableOpacity style={s.roleCard} onPress={() => navigation.navigate('CoachSignUp')}>
        <Text style={s.roleIcon}>🏆</Text>
        <Text style={s.roleTitle}>Coach</Text>
        <Text style={s.roleDesc}>Create a squad, manage your roster & award points</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.roleCard} onPress={() => navigation.navigate('CheerleaderSignUp')}>
        <Text style={s.roleIcon}>📣</Text>
        <Text style={s.roleTitle}>Cheerleader</Text>
        <Text style={s.roleDesc}>Join your squad with an invite code and track your progress</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.roleCard} onPress={() => navigation.navigate('ParentSignUp')}>
        <Text style={s.roleIcon}>👨‍👩‍👧</Text>
        <Text style={s.roleTitle}>Parent</Text>
        <Text style={s.roleDesc}>Join with an invite code and your child's parent code</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);

export default SignUpRoleScreen;

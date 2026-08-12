import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { authStyles as s } from './authStyles';

const CoachSignUpScreen = ({ navigation }) => {
  const { signUpCoach } = useApp();
  const [squadName, setSquadName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = squadName.trim() && name.trim() && email.trim() && password.length >= 6;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signUpCoach(email.trim(), password, name.trim(), squadName.trim());
    } catch (e) {
      setError(e.code === 'auth/email-already-in-use' ? 'That email is already in use.' : 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Text style={s.title}>🏆 Coach Sign Up</Text>
          <Text style={s.subtitle}>Create your squad. You'll get an invite code to share with cheerleaders and parents.</Text>

          <Text style={s.label}>Squad Name</Text>
          <TextInput style={s.input} value={squadName} onChangeText={setSquadName} placeholder="e.g. Thunder Cheer Squad" />

          <Text style={s.label}>Your Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Enter your name" />

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={[s.submitBtn, (!canSubmit || submitting) && s.submitBtnDisabled]} onPress={handleSubmit} disabled={!canSubmit || submitting}>
            <Text style={s.submitBtnText}>{submitting ? 'Creating squad…' : 'Create Squad'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CoachSignUpScreen;

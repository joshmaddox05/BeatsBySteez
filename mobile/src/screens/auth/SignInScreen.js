import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { authStyles as s } from './authStyles';

const SignInScreen = ({ navigation }) => {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // AppContext's auth listener picks up the session; RootNavigator routes by role.
    } catch (e) {
      setError('Could not sign in. Check your email and password.');
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

          <Text style={s.title}>Sign In</Text>
          <Text style={s.subtitle}>Welcome back to Cheer Merit Tracker</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[s.submitBtn, (submitting || !email || !password) && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !email || !password}
          >
            <Text style={s.submitBtnText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInScreen;

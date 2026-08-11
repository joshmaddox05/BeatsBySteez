import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { authStyles as s } from './authStyles';

const ParentSignUpScreen = ({ navigation }) => {
  const { resolveInviteCode, findCheerleaderByParentCode, signUpParentAccount } = useApp();

  const [inviteCode, setInviteCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = inviteCode.trim() && parentCode.trim() && name.trim() && email.trim() && password.length >= 6;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const squad = await resolveInviteCode(inviteCode);
      if (!squad) {
        setError('No squad found for that invite code.');
        return;
      }
      const cheerleader = await findCheerleaderByParentCode(squad.id, parentCode);
      if (!cheerleader) {
        setError('Invalid parent code for that squad. Check with your coach.');
        return;
      }
      await signUpParentAccount(email.trim(), password, name.trim(), squad.id, cheerleader.id);
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

          <Text style={s.title}>👨‍👩‍👧 Parent Sign Up</Text>
          <Text style={s.subtitle}>Enter the squad invite code and your child's parent code, both provided by the coach.</Text>

          <Text style={s.label}>Squad Invite Code</Text>
          <TextInput style={s.input} value={inviteCode} onChangeText={setInviteCode} placeholder="e.g. AB12CD" autoCapitalize="characters" />

          <Text style={s.label}>Child's Parent Code</Text>
          <TextInput style={s.input} value={parentCode} onChangeText={setParentCode} placeholder="e.g. EMMA2024" autoCapitalize="characters" />
          <Text style={s.hint}>Your code was provided by the coach</Text>

          <Text style={s.label}>Your Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Enter your name" />

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={[s.submitBtn, (!canSubmit || submitting) && s.submitBtnDisabled]} onPress={handleSubmit} disabled={!canSubmit || submitting}>
            <Text style={s.submitBtnText}>{submitting ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ParentSignUpScreen;

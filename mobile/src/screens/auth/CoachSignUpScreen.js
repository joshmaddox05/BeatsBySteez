import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { authStyles as s } from './authStyles';
import { colors } from '../../theme/colors';

const CoachSignUpScreen = ({ navigation }) => {
  const { signUpCoach, joinAsCoach, resolveCoachInviteCode } = useApp();
  const [mode, setMode] = useState('create'); // 'create' | 'join'

  const [squadName, setSquadName] = useState('');
  const [coachInviteCode, setCoachInviteCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    mode === 'create'
      ? squadName.trim() && name.trim() && email.trim() && password.length >= 6
      : coachInviteCode.trim() && name.trim() && email.trim() && password.length >= 6;

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await signUpCoach(email.trim(), password, name.trim(), squadName.trim());
      } else {
        const squad = await resolveCoachInviteCode(coachInviteCode);
        if (!squad) {
          setError('No squad found for that coach invite code.');
          return;
        }
        await joinAsCoach(email.trim(), password, name.trim(), squad.id, coachInviteCode.trim());
      }
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

          <TouchableOpacity style={cs.toggleRow} activeOpacity={1}>
            <TouchableOpacity
              style={[cs.toggleBtn, mode === 'create' && cs.toggleBtnActive]}
              onPress={() => switchMode('create')}
            >
              <Text style={[cs.toggleText, mode === 'create' && cs.toggleTextActive]}>Create New Squad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cs.toggleBtn, mode === 'join' && cs.toggleBtnActive]}
              onPress={() => switchMode('join')}
            >
              <Text style={[cs.toggleText, mode === 'join' && cs.toggleTextActive]}>Join as Assistant Coach</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {mode === 'create' ? (
            <>
              <Text style={s.subtitle}>Create your squad. You'll get an invite code to share with cheerleaders and parents.</Text>
              <Text style={s.label}>Squad Name</Text>
              <TextInput style={s.input} value={squadName} onChangeText={setSquadName} placeholder="e.g. Thunder Cheer Squad" />
            </>
          ) : (
            <>
              <Text style={s.subtitle}>Enter the coach invite code the head coach gave you — it's different from the cheerleader/parent invite code.</Text>
              <Text style={s.label}>Coach Invite Code</Text>
              <TextInput
                style={s.input}
                value={coachInviteCode}
                onChangeText={setCoachInviteCode}
                placeholder="e.g. AB12CD"
                autoCapitalize="characters"
              />
            </>
          )}

          <Text style={s.label}>Your Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Enter your name" />

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={[s.submitBtn, (!canSubmit || submitting) && s.submitBtnDisabled]} onPress={handleSubmit} disabled={!canSubmit || submitting}>
            <Text style={s.submitBtnText}>
              {submitting ? 'Creating account…' : mode === 'create' ? 'Create Squad' : 'Join Squad'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const cs = StyleSheet.create({
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontWeight: '700', color: colors.textSecondary, fontSize: 12 },
  toggleTextActive: { color: '#fff' },
});

export default CoachSignUpScreen;

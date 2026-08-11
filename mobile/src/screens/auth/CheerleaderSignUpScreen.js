import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { authStyles as s } from './authStyles';

const CheerleaderSignUpScreen = ({ navigation }) => {
  const { resolveInviteCode, listCheerleaders, signUpCheerleaderAccount } = useApp();

  const [inviteCode, setInviteCode] = useState('');
  const [squad, setSquad] = useState(null);
  const [roster, setRoster] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFindSquad = async () => {
    setError('');
    setSubmitting(true);
    try {
      const found = await resolveInviteCode(inviteCode);
      if (!found) {
        setError('No squad found for that invite code.');
        return;
      }
      const cheerleaders = await listCheerleaders(found.id);
      if (cheerleaders.length === 0) {
        setError('Your coach hasn\'t added any cheerleaders to the roster yet. Ask them to add you first.');
        return;
      }
      setSquad(found);
      setRoster(cheerleaders);
    } catch (e) {
      setError('Something went wrong looking up that squad.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setError('');
    setSubmitting(true);
    try {
      const cheerleader = roster.find((c) => c.id === selectedId);
      await signUpCheerleaderAccount(email.trim(), password, cheerleader.name, squad.id, selectedId);
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

          <Text style={s.title}>📣 Cheerleader Sign Up</Text>

          {!squad ? (
            <>
              <Text style={s.subtitle}>Enter the invite code your coach gave you.</Text>
              <Text style={s.label}>Squad Invite Code</Text>
              <TextInput
                style={s.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="e.g. AB12CD"
                autoCapitalize="characters"
              />
              {!!error && <Text style={s.errorText}>{error}</Text>}
              <TouchableOpacity
                style={[s.submitBtn, (!inviteCode.trim() || submitting) && s.submitBtnDisabled]}
                onPress={handleFindSquad}
                disabled={!inviteCode.trim() || submitting}
              >
                <Text style={s.submitBtnText}>{submitting ? 'Looking up squad…' : 'Find My Squad'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.subtitle}>Joining {squad.name}. Select your name from the roster.</Text>

              {roster.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.roleCard, selectedId === c.id && { borderColor: '#6366f1' }]}
                  onPress={() => setSelectedId(c.id)}
                >
                  <Text style={s.roleTitle}>
                    {c.avatar} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {selectedId && (
                <View>
                  <Text style={s.label}>Email</Text>
                  <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

                  <Text style={s.label}>Password</Text>
                  <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />

                  {!!error && <Text style={s.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[s.submitBtn, (!email || password.length < 6 || submitting) && s.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!email || password.length < 6 || submitting}
                  >
                    <Text style={s.submitBtnText}>{submitting ? 'Creating account…' : 'Create Account'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CheerleaderSignUpScreen;

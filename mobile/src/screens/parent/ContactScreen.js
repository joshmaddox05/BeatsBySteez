import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import { colors } from '../../theme/colors';

const ContactScreen = () => {
  const { currentUser, sendMessage, getMessagesForUser, squad } = useApp();
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);

  const myMessages = getMessagesForUser(currentUser?.id || '');

  const handleSend = () => {
    if (!content.trim() || !squad) return;
    sendMessage(squad.coachId, content.trim());
    setContent('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="✉️ Contact Coach" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {sent && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✅ Message sent successfully!</Text>
            </View>
          )}

          <Text style={styles.label}>Your Message</Text>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={setContent}
            placeholder="Write a message to the coach..."
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!content.trim()}>
            <Text style={styles.sendBtnText}>Send Message</Text>
          </TouchableOpacity>

          <Text style={styles.historyTitle}>Message History</Text>
          {myMessages.length === 0 ? (
            <Text style={styles.noMessages}>No messages yet.</Text>
          ) : (
            myMessages.map((msg) => (
              <View key={msg.id} style={styles.messageItem}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageFrom}>{msg.fromName}</Text>
                  <Text style={styles.messageTime}>{new Date(msg.timestamp).toLocaleString()}</Text>
                </View>
                <Text style={styles.messageContent}>{msg.content}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  successBanner: { backgroundColor: colors.positiveBg, borderRadius: 10, padding: 10, marginBottom: 12 },
  successText: { color: colors.positiveText, fontWeight: '600' },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  textarea: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 100, textAlignVertical: 'top', backgroundColor: colors.card },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12, marginBottom: 24 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700' },
  historyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  noMessages: { color: colors.textSecondary, fontStyle: 'italic' },
  messageItem: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  messageFrom: { fontWeight: '700', color: colors.textPrimary },
  messageTime: { fontSize: 11, color: colors.textSecondary },
  messageContent: { color: colors.textPrimary },
});

export default ContactScreen;

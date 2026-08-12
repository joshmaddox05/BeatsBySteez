import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const formatTime = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Web keys threads off a hardcoded 'coach' id; here every participant is a real
// Firebase uid, so "me" is whoever is signed in and the counterpart is the
// other uid on the message.
const MessageInbox = () => {
  const { messages, currentUser, sendMessage, markThreadAsRead } = useApp();
  const [openThreadId, setOpenThreadId] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const myId = currentUser?.id;

  const threads = useMemo(() => {
    const byCounterpart = new Map();
    messages
      .filter((m) => m.toId === myId || m.fromId === myId)
      .forEach((m) => {
        const counterpartId = m.fromId === myId ? m.toId : m.fromId;
        if (!counterpartId) return;
        if (!byCounterpart.has(counterpartId)) {
          byCounterpart.set(counterpartId, {
            counterpartId,
            counterpartName: m.fromId === myId ? 'Parent' : m.fromName,
            messages: [],
            unread: 0,
          });
        }
        const thread = byCounterpart.get(counterpartId);
        thread.messages.push(m);
        if (m.toId === myId && !m.read) thread.unread += 1;
        if (m.fromId !== myId && m.fromName) thread.counterpartName = m.fromName;
      });

    return [...byCounterpart.values()]
      .map((thread) => ({
        ...thread,
        messages: [...thread.messages].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        ),
      }))
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.timestamp || 0;
        const bLast = b.messages[b.messages.length - 1]?.timestamp || 0;
        return new Date(bLast) - new Date(aLast);
      });
  }, [messages, myId]);

  const openThread = threads.find((t) => t.counterpartId === openThreadId) || null;

  const handleOpen = (thread) => {
    setOpenThreadId(thread.counterpartId);
    setReply('');
    if (thread.unread > 0) markThreadAsRead(thread.counterpartId);
  };

  const handleReply = async () => {
    if (!reply.trim() || !openThread || sending) return;
    setSending(true);
    try {
      await sendMessage(openThread.counterpartId, reply.trim());
      setReply('');
    } finally {
      setSending(false);
    }
  };

  if (threads.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>
          No messages yet. Parents can reach you from their Contact Coach tab.
        </Text>
      </View>
    );
  }

  if (openThread) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={() => setOpenThreadId(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle} numberOfLines={1}>
            {openThread.counterpartName || 'Parent'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.threadBody} keyboardShouldPersistTaps="handled">
          {openThread.messages.map((m) => {
            const mine = m.fromId === myId;
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.bubbleSent : styles.bubbleReceived]}>
                <Text style={styles.bubbleMeta}>
                  {mine ? 'You' : m.fromName} · {formatTime(m.timestamp)}
                </Text>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextSent]}>{m.content}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.replyRow}>
          <TextInput
            style={styles.replyInput}
            value={reply}
            onChangeText={setReply}
            placeholder="Write a reply..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!reply.trim() || sending) && styles.disabled]}
            onPress={handleReply}
            disabled={!reply.trim() || sending}
          >
            <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {threads.map((thread) => {
        const last = thread.messages[thread.messages.length - 1];
        return (
          <TouchableOpacity
            key={thread.counterpartId}
            style={[styles.threadItem, thread.unread > 0 && styles.threadItemUnread]}
            onPress={() => handleOpen(thread)}
          >
            <Text style={styles.threadAvatar}>👤</Text>
            <View style={styles.threadInfo}>
              <Text style={styles.threadName}>{thread.counterpartName || 'Parent'}</Text>
              <Text style={styles.threadPreview} numberOfLines={1}>
                {last?.content}
              </Text>
            </View>
            {thread.unread > 0 && (
              <View style={styles.unreadDot}>
                <Text style={styles.unreadDotText}>{thread.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 12 },
  emptyWrap: { padding: 24 },
  empty: { color: colors.textSecondary, textAlign: 'center' },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  threadItemUnread: { borderWidth: 1, borderColor: colors.primary },
  threadAvatar: { fontSize: 24, marginRight: 10 },
  threadInfo: { flex: 1 },
  threadName: { fontWeight: '700', color: colors.textPrimary },
  threadPreview: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  unreadDot: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: { color: colors.primary, fontWeight: '600', marginRight: 12 },
  threadTitle: { flex: 1, fontWeight: '700', color: colors.textPrimary },
  threadBody: { padding: 12 },
  bubble: { borderRadius: 12, padding: 10, marginBottom: 8, maxWidth: '85%' },
  bubbleSent: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleReceived: { alignSelf: 'flex-start', backgroundColor: colors.card },
  bubbleMeta: { fontSize: 10, color: colors.textSecondary, marginBottom: 3 },
  bubbleText: { color: colors.textPrimary, fontSize: 14 },
  bubbleTextSent: { color: '#fff' },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});

export default MessageInbox;

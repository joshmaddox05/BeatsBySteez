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

// Two kinds of thread share this list: direct (one other uid) and group (one
// squad group, open to the coach plus everyone linked to a member of it).
// Group membership is derived from the squad's groups/cheerleaders, not a
// separate collection, so it always matches whoever the coach currently has
// in that group.
const MessageInbox = () => {
  const {
    messages,
    currentUser,
    userRole,
    groups,
    cheerleaders,
    squad,
    sendMessage,
    sendGroupMessage,
    markThreadAsRead,
    markGroupThreadAsRead,
  } = useApp();
  const [openThreadId, setOpenThreadId] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const myId = currentUser?.id;
  const isCoach = userRole === 'coach';

  const myGroups = useMemo(() => {
    if (isCoach) return groups;
    const linkedId = currentUser?.childId || currentUser?.cheerleaderId;
    const cheer = cheerleaders.find((c) => c.id === linkedId);
    if (!cheer) return [];
    return groups.filter((g) => (cheer.groupIds || []).includes(g.id));
  }, [groups, cheerleaders, currentUser, isCoach]);

  const directThreads = useMemo(() => {
    const byCounterpart = new Map();
    messages
      .filter((m) => !m.groupId && (m.toId === myId || m.fromId === myId))
      .forEach((m) => {
        const counterpartId = m.fromId === myId ? m.toId : m.fromId;
        if (!counterpartId) return;
        if (!byCounterpart.has(counterpartId)) {
          byCounterpart.set(counterpartId, {
            id: `direct:${counterpartId}`,
            kind: 'direct',
            counterpartId,
            name: m.fromId === myId ? 'Coach' : m.fromName,
            avatar: '👤',
            messages: [],
            unread: 0,
          });
        }
        const thread = byCounterpart.get(counterpartId);
        thread.messages.push(m);
        if (m.toId === myId && !m.read) thread.unread += 1;
        if (m.fromId !== myId && m.fromName) thread.name = m.fromName;
      });

    // Parents/cheerleaders always get a pinned thread with the coach, even
    // before the first message, so they can start the conversation.
    if (!isCoach && squad?.coachId && !byCounterpart.has(squad.coachId)) {
      byCounterpart.set(squad.coachId, {
        id: `direct:${squad.coachId}`,
        kind: 'direct',
        counterpartId: squad.coachId,
        name: 'Coach',
        avatar: '👤',
        messages: [],
        unread: 0,
      });
    }

    return [...byCounterpart.values()].map((thread) => ({
      ...thread,
      messages: [...thread.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    }));
  }, [messages, myId, isCoach, squad]);

  const groupThreads = useMemo(
    () =>
      myGroups.map((g) => {
        const groupMessages = messages
          .filter((m) => m.groupId === g.id)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const unread = groupMessages.filter(
          (m) => m.fromId !== myId && !(m.readBy || []).includes(myId)
        ).length;
        return {
          id: `group:${g.id}`,
          kind: 'group',
          groupId: g.id,
          name: g.name,
          avatar: g.icon || '👥',
          messages: groupMessages,
          unread,
        };
      }),
    [myGroups, messages, myId]
  );

  const threads = useMemo(
    () =>
      [...directThreads, ...groupThreads].sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.timestamp || '';
        const bLast = b.messages[b.messages.length - 1]?.timestamp || '';
        if (!aLast && !bLast) return a.name.localeCompare(b.name);
        if (!aLast) return 1;
        if (!bLast) return -1;
        return new Date(bLast) - new Date(aLast);
      }),
    [directThreads, groupThreads]
  );

  const openThread = threads.find((t) => t.id === openThreadId) || null;

  const handleOpen = (thread) => {
    setOpenThreadId(thread.id);
    setReply('');
    if (thread.unread > 0) {
      if (thread.kind === 'group') markGroupThreadAsRead(thread.groupId);
      else markThreadAsRead(thread.counterpartId);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !openThread || sending) return;
    setSending(true);
    try {
      if (openThread.kind === 'group') {
        await sendGroupMessage(openThread.groupId, reply.trim());
      } else {
        await sendMessage(openThread.counterpartId, reply.trim());
      }
      setReply('');
    } finally {
      setSending(false);
    }
  };

  if (threads.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>No conversations yet.</Text>
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
            {openThread.avatar} {openThread.name}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.threadBody} keyboardShouldPersistTaps="handled">
          {openThread.messages.length === 0 ? (
            <Text style={styles.empty}>
              {openThread.kind === 'group'
                ? `Say hi to ${openThread.name} — everyone in the group will see it.`
                : 'Send the first message.'}
            </Text>
          ) : (
            openThread.messages.map((m) => {
              const mine = m.fromId === myId;
              return (
                <View key={m.id} style={[styles.bubble, mine ? styles.bubbleSent : styles.bubbleReceived]}>
                  <Text style={styles.bubbleMeta}>
                    {mine ? 'You' : m.fromName} · {formatTime(m.timestamp)}
                  </Text>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextSent]}>{m.content}</Text>
                </View>
              );
            })
          )}
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
            key={thread.id}
            style={[styles.threadItem, thread.unread > 0 && styles.threadItemUnread]}
            onPress={() => handleOpen(thread)}
          >
            <Text style={styles.threadAvatar}>{thread.avatar}</Text>
            <View style={styles.threadInfo}>
              <View style={styles.threadNameRow}>
                <Text style={styles.threadName}>{thread.name}</Text>
                {thread.kind === 'group' && (
                  <View style={styles.groupTag}>
                    <Text style={styles.groupTagText}>Group</Text>
                  </View>
                )}
              </View>
              <Text style={styles.threadPreview} numberOfLines={1}>
                {last?.content || 'No messages yet'}
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
  threadNameRow: { flexDirection: 'row', alignItems: 'center' },
  threadName: { fontWeight: '700', color: colors.textPrimary },
  groupTag: {
    marginLeft: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupTagText: { fontSize: 10, fontWeight: '700', color: colors.primary },
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

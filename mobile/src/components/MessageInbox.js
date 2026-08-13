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

const ROLE_LABELS = { coach: 'Coach', parent: 'Parent', cheerleader: 'Cheerleader' };

// Three kinds of thread share this list: direct (one other uid), group (one
// squad group, open to the coach plus everyone linked to a member of it),
// and custom (a hand-picked set of people, started from the "+ New" picker).
// Group/custom membership is derived from live squad data, not fixed at
// creation, so it always matches who the coach currently has in a group.
const MessageInbox = () => {
  const {
    messages,
    currentUser,
    userRole,
    groups,
    cheerleaders,
    members,
    customThreads,
    squad,
    sendMessage,
    sendGroupMessage,
    sendThreadMessage,
    markThreadAsRead,
    markGroupThreadAsRead,
    markCustomThreadAsRead,
    createCustomThread,
  } = useApp();
  const [openThreadId, setOpenThreadId] = useState(null);
  const [draftThread, setDraftThread] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');
  const [composeSelected, setComposeSelected] = useState([]);
  const [composeBusy, setComposeBusy] = useState(false);

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
      .filter((m) => !m.groupId && !m.threadId && (m.toId === myId || m.fromId === myId))
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

  const customThreadList = useMemo(
    () =>
      customThreads
        .filter((t) => (t.memberIds || []).includes(myId))
        .map((t) => {
          const threadMessages = messages
            .filter((m) => m.threadId === t.id)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const unread = threadMessages.filter(
            (m) => m.fromId !== myId && !(m.readBy || []).includes(myId)
          ).length;
          const otherNames = Object.entries(t.memberNames || {})
            .filter(([uid]) => uid !== myId)
            .map(([, name]) => name);
          const name =
            otherNames.length <= 2
              ? otherNames.join(', ') || 'Group message'
              : `${otherNames.slice(0, 2).join(', ')} +${otherNames.length - 2}`;
          return {
            id: `custom:${t.id}`,
            kind: 'custom',
            threadId: t.id,
            name,
            avatar: '👥',
            messages: threadMessages,
            unread,
          };
        }),
    [customThreads, messages, myId]
  );

  const threads = useMemo(() => {
    const all = [...directThreads, ...groupThreads, ...customThreadList];
    if (draftThread && !all.some((t) => t.id === draftThread.id)) all.push(draftThread);
    return all.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp || '';
      const bLast = b.messages[b.messages.length - 1]?.timestamp || '';
      if (!aLast && !bLast) return a.name.localeCompare(b.name);
      if (!aLast) return 1;
      if (!bLast) return -1;
      return new Date(bLast) - new Date(aLast);
    });
  }, [directThreads, groupThreads, customThreadList, draftThread]);

  const openThread = threads.find((t) => t.id === openThreadId) || null;

  const pickablePeople = useMemo(() => {
    const term = composeSearch.trim().toLowerCase();
    return members
      .filter((m) => m.uid !== myId)
      .map((m) => {
        const linkedCheer = m.linkedCheerleaderId
          ? cheerleaders.find((c) => c.id === m.linkedCheerleaderId)
          : null;
        const roleLabel = ROLE_LABELS[m.role] || m.role;
        const subtitle = linkedCheer ? `${roleLabel} · ${linkedCheer.name}` : roleLabel;
        return { uid: m.uid, name: m.displayName || 'Member', subtitle, role: m.role };
      })
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.subtitle.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, cheerleaders, myId, composeSearch]);

  const handleOpen = (thread) => {
    setOpenThreadId(thread.id);
    setDraftThread(null);
    setReply('');
    if (thread.unread > 0) {
      if (thread.kind === 'group') markGroupThreadAsRead(thread.groupId);
      else if (thread.kind === 'custom') markCustomThreadAsRead(thread.threadId);
      else markThreadAsRead(thread.counterpartId);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !openThread || sending) return;
    setSending(true);
    try {
      if (openThread.kind === 'group') {
        await sendGroupMessage(openThread.groupId, reply.trim());
      } else if (openThread.kind === 'custom') {
        await sendThreadMessage(openThread.threadId, reply.trim());
      } else {
        await sendMessage(openThread.counterpartId, reply.trim());
      }
      setReply('');
    } finally {
      setSending(false);
    }
  };

  const openCompose = () => {
    setComposeSearch('');
    setComposeSelected([]);
    setComposing(true);
  };

  const toggleComposeSelected = (person) => {
    setComposeSelected((prev) =>
      prev.some((p) => p.uid === person.uid) ? prev.filter((p) => p.uid !== person.uid) : [...prev, person]
    );
  };

  const handleStartThread = async () => {
    if (composeSelected.length === 0 || composeBusy) return;
    setComposeBusy(true);
    try {
      if (composeSelected.length === 1) {
        const person = composeSelected[0];
        const id = `direct:${person.uid}`;
        setDraftThread({
          id,
          kind: 'direct',
          counterpartId: person.uid,
          name: person.name,
          avatar: '👤',
          messages: [],
          unread: 0,
        });
        setOpenThreadId(id);
      } else {
        const thread = await createCustomThread(composeSelected);
        const id = `custom:${thread.id}`;
        setDraftThread({
          id,
          kind: 'custom',
          threadId: thread.id,
          name: composeSelected.map((p) => p.name).join(', '),
          avatar: '👥',
          messages: [],
          unread: 0,
        });
        setOpenThreadId(id);
      }
      setComposing(false);
      setReply('');
    } finally {
      setComposeBusy(false);
    }
  };

  if (composing) {
    return (
      <View style={styles.flex}>
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={() => setComposing(false)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle}>New Message</Text>
        </View>

        <View style={styles.composeSearchWrap}>
          <TextInput
            style={styles.composeSearchInput}
            value={composeSearch}
            onChangeText={setComposeSearch}
            placeholder="Search people..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {composeSelected.length > 0 && (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedText} numberOfLines={1}>
              {composeSelected.map((p) => p.name).join(', ')}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.list}>
          {pickablePeople.length === 0 ? (
            <Text style={styles.empty}>No one else has joined the squad yet.</Text>
          ) : (
            pickablePeople.map((person) => {
              const selected = composeSelected.some((p) => p.uid === person.uid);
              return (
                <TouchableOpacity
                  key={person.uid}
                  style={[styles.pickRow, selected && styles.pickRowSelected]}
                  onPress={() => toggleComposeSelected(person)}
                >
                  <View style={styles.pickCheck}>{selected && <Text style={styles.pickCheckMark}>✓</Text>}</View>
                  <View style={styles.threadInfo}>
                    <Text style={styles.threadName}>{person.name}</Text>
                    <Text style={styles.threadPreview}>{person.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={styles.composeFooter}>
          <TouchableOpacity
            style={[styles.sendBtn, (composeSelected.length === 0 || composeBusy) && styles.disabled]}
            onPress={handleStartThread}
            disabled={composeSelected.length === 0 || composeBusy}
          >
            <Text style={styles.sendBtnText}>
              {composeBusy ? '…' : composeSelected.length > 1 ? 'Start Group Thread' : 'Start Conversation'}
            </Text>
          </TouchableOpacity>
        </View>
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
          <TouchableOpacity
            onPress={() => {
              setOpenThreadId(null);
              setDraftThread(null);
            }}
          >
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle} numberOfLines={1}>
            {openThread.avatar} {openThread.name}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.threadBody} keyboardShouldPersistTaps="handled">
          {openThread.messages.length === 0 ? (
            <Text style={styles.empty}>
              {openThread.kind !== 'direct'
                ? `Say hi to ${openThread.name} — everyone in the thread will see it.`
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
    <View style={styles.flex}>
      <View style={styles.newRow}>
        <TouchableOpacity style={styles.newBtn} onPress={openCompose}>
          <Text style={styles.newBtnText}>+ New Message</Text>
        </TouchableOpacity>
      </View>

      {threads.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No conversations yet. Tap "+ New Message" to start one.</Text>
        </View>
      ) : (
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
                    {thread.kind !== 'direct' && (
                      <View style={styles.groupTag}>
                        <Text style={styles.groupTagText}>{thread.kind === 'group' ? 'Group' : 'Custom'}</Text>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 12 },
  emptyWrap: { padding: 24 },
  empty: { color: colors.textSecondary, textAlign: 'center' },
  newRow: { paddingHorizontal: 12, paddingTop: 8 },
  newBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  newBtnText: { color: '#fff', fontWeight: '700' },
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
  composeSearchWrap: { padding: 12, paddingBottom: 0 },
  composeSearchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  selectedRow: { paddingHorizontal: 16, paddingTop: 8 },
  selectedText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pickRowSelected: { borderWidth: 1, borderColor: colors.primary },
  pickCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickCheckMark: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  composeFooter: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
});

export default MessageInbox;

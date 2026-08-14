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

const ROLE_SECTIONS = [
  { key: 'coach', label: '🏆 Coaches' },
  { key: 'cheerleader', label: '📣 Cheerleaders' },
  { key: 'parent', label: '👨‍👩‍👧 Parents' },
];

// Four kinds of thread share this list: person (one other person on the
// roster), direct (one other account with no roster spot — i.e. another
// coach), group (one squad group), and custom (a hand-picked set of people).
//
// People are addressed by roster *slot* — "the athlete in row X" or "X's
// parent" — not by account uid, so a coach can start a conversation with
// someone who hasn't signed up yet. Whoever links to that roster spot later
// inherits the whole backlog. Group/custom membership is likewise derived from
// live squad data, so it always matches who the coach currently has in a group.
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
    mySlot,
    sendMessage,
    sendSlotMessage,
    sendGroupMessage,
    sendThreadMessage,
    markPersonThreadAsRead,
    markGroupThreadAsRead,
    markCustomThreadAsRead,
    createCustomThread,
  } = useApp();
  const [openThreadId, setOpenThreadId] = useState(null);
  const [draftThread, setDraftThread] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeSelected, setComposeSelected] = useState([]);
  const [composeBusy, setComposeBusy] = useState(false);
  const [error, setError] = useState(null);

  const myId = currentUser?.id;
  const isCoach = userRole === 'coach';

  // Every person the squad has, whether or not they've made an account: two
  // slots per roster row (the cheerleader and her parent), plus one entry per
  // coach. Accounts are matched onto their slot so an existing conversation
  // and a not-yet-joined one are the same thread, never two.
  const people = useMemo(() => {
    const accountsFor = (role, cheerleaderId) =>
      members.filter((m) => m.role === role && m.linkedCheerleaderId === cheerleaderId);

    const roster = cheerleaders.flatMap((c) => {
      const athletes = accountsFor('cheerleader', c.id);
      const parents = accountsFor('parent', c.id);
      return [
        {
          key: `athlete:${c.id}`,
          slot: `athlete:${c.id}`,
          uids: athletes.map((m) => m.uid),
          role: 'cheerleader',
          cheerleaderId: c.id,
          name: athletes[0]?.displayName || c.name,
          avatar: c.avatar || '📣',
          subtitle: athletes.length ? 'Cheerleader' : 'Hasn’t joined yet',
          joined: athletes.length > 0,
          code: squad?.inviteCode,
          codeLabel: 'squad code',
        },
        {
          key: `parent:${c.id}`,
          slot: `parent:${c.id}`,
          uids: parents.map((m) => m.uid),
          role: 'parent',
          cheerleaderId: c.id,
          name: parents[0]?.displayName || `${c.name}’s parent`,
          avatar: '👨‍👩‍👧',
          subtitle: parents.length ? `${c.name}’s parent` : 'Hasn’t joined yet',
          joined: parents.length > 0,
          code: c.parentCode,
          codeLabel: 'parent code',
        },
      ];
    });

    const coaches = members
      .filter((m) => m.role === 'coach')
      .map((m) => ({
        key: `uid:${m.uid}`,
        slot: null,
        uids: [m.uid],
        role: 'coach',
        cheerleaderId: null,
        name: m.displayName || 'Coach',
        avatar: '🏆',
        subtitle: 'Coach',
        joined: true,
      }));

    // Drop my own entry, whichever kind it is.
    return [...coaches, ...roster].filter((p) => p.key !== mySlot && !p.uids.includes(myId));
  }, [cheerleaders, members, squad, mySlot, myId]);

  const peopleByKey = useMemo(() => new Map(people.map((p) => [p.key, p])), [people]);

  // uid -> roster slot, so a reply sent from an account lands in the same
  // thread as the slot messages that came before it.
  const slotByUid = useMemo(() => {
    const map = new Map();
    members.forEach((m) => {
      if (!m.linkedCheerleaderId) return;
      if (m.role === 'cheerleader') map.set(m.uid, `athlete:${m.linkedCheerleaderId}`);
      else if (m.role === 'parent') map.set(m.uid, `parent:${m.linkedCheerleaderId}`);
    });
    return map;
  }, [members]);

  const keyForUid = (uid) => slotByUid.get(uid) || `uid:${uid}`;

  const slotsWithAccounts = useMemo(() => new Set(slotByUid.values()), [slotByUid]);

  const myGroups = useMemo(() => {
    if (isCoach) return groups;
    const linkedId = currentUser?.childId || currentUser?.cheerleaderId;
    const cheer = cheerleaders.find((c) => c.id === linkedId);
    if (!cheer) return [];
    return groups.filter((g) => (cheer.groupIds || []).includes(g.id));
  }, [groups, cheerleaders, currentUser, isCoach]);

  // Squad-wide message reads mean I can see everyone's mail; only messages I'm
  // actually a party to belong in my inbox.
  const isMine = (m) =>
    !m.groupId &&
    !m.threadId &&
    (m.fromId === myId || m.toId === myId || (!!m.toSlot && m.toSlot === mySlot));

  const isUnread = (m) => {
    if (m.fromId === myId) return false;
    if (Array.isArray(m.readBy)) return !m.readBy.includes(myId);
    return m.toId === myId && !m.read;
  };

  const personThreads = useMemo(() => {
    const byKey = new Map();

    messages.filter(isMine).forEach((m) => {
      const key =
        m.fromId === myId
          ? m.toSlot || (m.toId ? keyForUid(m.toId) : null)
          : keyForUid(m.fromId);
      if (!key) return;

      if (!byKey.has(key)) {
        const person = peopleByKey.get(key);
        byKey.set(key, {
          id: key,
          kind: 'person',
          slot: person?.slot ?? (key.startsWith('uid:') ? null : key),
          counterpartIds: person?.uids || (key.startsWith('uid:') ? [key.slice(4)] : []),
          name: person?.name || m.fromName || 'Conversation',
          avatar: person?.avatar || '👤',
          pending: person ? !person.joined : false,
          messages: [],
          unread: 0,
        });
      }
      const thread = byKey.get(key);
      thread.messages.push(m);
      if (isUnread(m)) thread.unread += 1;
    });

    // Parents/cheerleaders always get a pinned thread with the coach, even
    // before the first message, so they can start the conversation.
    if (!isCoach && squad?.coachId) {
      const key = keyForUid(squad.coachId);
      if (!byKey.has(key)) {
        const person = peopleByKey.get(key);
        byKey.set(key, {
          id: key,
          kind: 'person',
          slot: null,
          counterpartIds: [squad.coachId],
          name: person?.name || 'Coach',
          avatar: '🏆',
          pending: false,
          messages: [],
          unread: 0,
        });
      }
    }

    return [...byKey.values()].map((thread) => ({
      ...thread,
      messages: [...thread.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    }));
  }, [messages, myId, mySlot, peopleByKey, slotByUid, isCoach, squad]);

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
      customThreads.map((t) => {
        const threadMessages = messages
          .filter((m) => m.threadId === t.id)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const unread = threadMessages.filter(
          (m) => m.fromId !== myId && !(m.readBy || []).includes(myId)
        ).length;
        const otherNames = [
          ...Object.entries(t.memberNames || {})
            .filter(([uid]) => uid !== myId)
            .map(([, name]) => name),
          ...Object.entries(t.slotNames || {})
            .filter(([slot]) => slot !== mySlot)
            .map(([, name]) => name),
        ];
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
          pending: (t.memberSlots || []).some((s) => !slotsWithAccounts.has(s)),
          messages: threadMessages,
          unread,
        };
      }),
    [customThreads, messages, myId, mySlot, slotsWithAccounts]
  );

  const threads = useMemo(() => {
    const all = [...personThreads, ...groupThreads, ...customThreadList];
    if (draftThread && !all.some((t) => t.id === draftThread.id)) all.push(draftThread);
    return all.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp || '';
      const bLast = b.messages[b.messages.length - 1]?.timestamp || '';
      if (!aLast && !bLast) return a.name.localeCompare(b.name);
      if (!aLast) return 1;
      if (!bLast) return -1;
      return new Date(bLast) - new Date(aLast);
    });
  }, [personThreads, groupThreads, customThreadList, draftThread]);

  const openThread = threads.find((t) => t.id === openThreadId) || null;

  // A tap-to-pick avatar grid, grouped by role, instead of a search box —
  // squads are small enough that browsing beats typing a name.
  const peopleByRole = useMemo(() => {
    const sections = {};
    [...people]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((person) => {
        (sections[person.role] = sections[person.role] || []).push(person);
      });
    return sections;
  }, [people]);

  // "Pick a whole group" chips: selects/deselects the cheerleader *and* the
  // parent for every roster row in that squad group in one tap.
  const peopleInGroup = (groupId) => {
    const cheerIds = cheerleaders
      .filter((c) => (c.groupIds || []).includes(groupId))
      .map((c) => c.id);
    return people.filter((p) => p.cheerleaderId && cheerIds.includes(p.cheerleaderId));
  };

  const toggleGroupSelect = (groupId) => {
    const groupPeople = peopleInGroup(groupId);
    if (groupPeople.length === 0) return;
    const allSelected = groupPeople.every((p) => composeSelected.some((s) => s.key === p.key));
    setComposeSelected((prev) => {
      if (allSelected) return prev.filter((p) => !groupPeople.some((g) => g.key === p.key));
      const merged = [...prev];
      groupPeople.forEach((p) => {
        if (!merged.some((m) => m.key === p.key)) merged.push(p);
      });
      return merged;
    });
  };

  const handleOpen = (thread) => {
    setOpenThreadId(thread.id);
    setDraftThread(null);
    setReply('');
    setError(null);
    if (thread.unread > 0) {
      if (thread.kind === 'group') markGroupThreadAsRead(thread.groupId);
      else if (thread.kind === 'custom') markCustomThreadAsRead(thread.threadId);
      else markPersonThreadAsRead(thread.messages);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !openThread || sending) return;
    setSending(true);
    setError(null);
    try {
      if (openThread.kind === 'group') {
        await sendGroupMessage(openThread.groupId, reply.trim());
      } else if (openThread.kind === 'custom') {
        await sendThreadMessage(openThread.threadId, reply.trim());
      } else if (openThread.slot) {
        // Always addressed to the roster slot, even once they have an account,
        // so one person never ends up with two threads.
        await sendSlotMessage(openThread.slot, reply.trim());
      } else {
        await sendMessage(openThread.counterpartIds[0], reply.trim());
      }
      setReply('');
    } catch (e) {
      setError(e?.message || 'Could not send that message.');
    } finally {
      setSending(false);
    }
  };

  const openCompose = () => {
    setComposeSelected([]);
    setError(null);
    setComposing(true);
  };

  const toggleComposeSelected = (person) => {
    setComposeSelected((prev) =>
      prev.some((p) => p.key === person.key)
        ? prev.filter((p) => p.key !== person.key)
        : [...prev, person]
    );
  };

  const handleStartThread = async () => {
    if (composeSelected.length === 0 || composeBusy) return;
    setComposeBusy(true);
    setError(null);
    try {
      if (composeSelected.length === 1) {
        const person = composeSelected[0];
        setDraftThread({
          id: person.key,
          kind: 'person',
          slot: person.slot,
          counterpartIds: person.uids,
          name: person.name,
          avatar: person.avatar,
          pending: !person.joined,
          messages: [],
          unread: 0,
        });
        setOpenThreadId(person.key);
      } else {
        const thread = await createCustomThread(composeSelected);
        const id = `custom:${thread.id}`;
        setDraftThread({
          id,
          kind: 'custom',
          threadId: thread.id,
          name: composeSelected.map((p) => p.name).join(', '),
          avatar: '👥',
          pending: composeSelected.some((p) => !p.joined),
          messages: [],
          unread: 0,
        });
        setOpenThreadId(id);
      }
      setComposing(false);
      setReply('');
    } catch (e) {
      setError(e?.message || 'Could not start that conversation.');
    } finally {
      setComposeBusy(false);
    }
  };

  if (composing) {
    const rosterEmpty = cheerleaders.length === 0;
    return (
      <View style={styles.flex}>
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={() => setComposing(false)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle}>New Message</Text>
        </View>

        {composeSelected.length > 0 && (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedText} numberOfLines={1}>
              {composeSelected.length} selected · {composeSelected.map((p) => p.name).join(', ')}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.composeScroll}>
          {people.length === 0 ? (
            <Text style={styles.empty}>
              {rosterEmpty
                ? 'Add cheerleaders to your squad first — then you can message them and their parents here, even before they make an account.'
                : 'There’s nobody else to message yet.'}
            </Text>
          ) : (
            <>
              {groups.length > 0 && (
                <View style={styles.pickSection}>
                  <Text style={styles.pickSectionLabel}>Pick a whole group</Text>
                  <View style={styles.chipRow}>
                    {groups.map((group) => {
                      const groupPeople = peopleInGroup(group.id);
                      if (groupPeople.length === 0) return null;
                      const allSelected = groupPeople.every((p) =>
                        composeSelected.some((s) => s.key === p.key)
                      );
                      return (
                        <TouchableOpacity
                          key={group.id}
                          style={[
                            styles.groupChip,
                            { borderColor: group.color },
                            allSelected && { backgroundColor: group.color },
                          ]}
                          onPress={() => toggleGroupSelect(group.id)}
                        >
                          <Text
                            style={[styles.groupChipText, allSelected && styles.groupChipTextActive]}
                          >
                            {group.icon} {group.name} · {groupPeople.length}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {ROLE_SECTIONS.map((section) => {
                const sectionPeople = peopleByRole[section.key] || [];
                if (sectionPeople.length === 0) return null;
                return (
                  <View key={section.key} style={styles.pickSection}>
                    <Text style={styles.pickSectionLabel}>{section.label}</Text>
                    <View style={styles.personGrid}>
                      {sectionPeople.map((person) => {
                        const selected = composeSelected.some((p) => p.key === person.key);
                        return (
                          <TouchableOpacity
                            key={person.key}
                            style={styles.personCard}
                            onPress={() => toggleComposeSelected(person)}
                          >
                            <View
                              style={[
                                styles.personAvatarWrap,
                                selected && styles.personAvatarWrapSelected,
                              ]}
                            >
                              <Text style={styles.personAvatar}>{person.avatar}</Text>
                              {selected && (
                                <View style={styles.personCheck}>
                                  <Text style={styles.personCheckMark}>✓</Text>
                                </View>
                              )}
                              {!person.joined && !selected && <View style={styles.pendingPip} />}
                            </View>
                            <Text style={styles.personName} numberOfLines={1}>
                              {person.name}
                            </Text>
                            <Text style={styles.personSubtitle} numberOfLines={1}>
                              {person.subtitle}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <Text style={styles.hint}>
                A dot means they haven’t made an account yet. You can still write to them — the
                messages are waiting the moment they join.
              </Text>
            </>
          )}
        </ScrollView>

        <View style={styles.composeFooter}>
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              styles.fullWidthBtn,
              (composeSelected.length === 0 || composeBusy) && styles.disabled,
            ]}
            onPress={handleStartThread}
            disabled={composeSelected.length === 0 || composeBusy}
          >
            <Text style={styles.sendBtnText}>
              {composeBusy
                ? '…'
                : composeSelected.length > 1
                ? `Start Group Thread (${composeSelected.length})`
                : 'Start Conversation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (openThread) {
    const person = peopleByKey.get(openThread.id);
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
              setError(null);
            }}
          >
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle} numberOfLines={1}>
            {openThread.avatar} {openThread.name}
          </Text>
        </View>

        {openThread.pending && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerText}>
              {person?.code
                ? `Waiting for them to join — share the ${person.codeLabel} ${person.code}. Your messages are saved until then.`
                : 'Waiting for them to join — your messages are saved until then.'}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.threadBody} keyboardShouldPersistTaps="handled">
          {openThread.messages.length === 0 ? (
            <Text style={styles.empty}>
              {openThread.kind !== 'person'
                ? `Say hi to ${openThread.name} — everyone in the thread will see it.`
                : 'Send the first message.'}
            </Text>
          ) : (
            openThread.messages.map((m) => {
              const mine = m.fromId === myId;
              return (
                <View
                  key={m.id}
                  style={[styles.bubble, mine ? styles.bubbleSent : styles.bubbleReceived]}
                >
                  <Text style={styles.bubbleMeta}>
                    {mine ? 'You' : m.fromName} · {formatTime(m.timestamp)}
                  </Text>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextSent]}>{m.content}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {error && <Text style={styles.error}>{error}</Text>}
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
                    {thread.kind === 'group' && (
                      <View style={styles.groupTag}>
                        <Text style={styles.groupTagText}>Group</Text>
                      </View>
                    )}
                    {thread.kind === 'custom' && (
                      <View style={styles.groupTag}>
                        <Text style={styles.groupTagText}>Custom</Text>
                      </View>
                    )}
                    {thread.pending && (
                      <View style={styles.pendingTag}>
                        <Text style={styles.pendingTagText}>Not joined</Text>
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
  hint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
  error: { color: '#b91c1c', fontSize: 12, paddingHorizontal: 12, paddingBottom: 8 },
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
  threadNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  threadName: { fontWeight: '700', color: colors.textPrimary },
  groupTag: {
    marginLeft: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupTagText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  pendingTag: {
    marginLeft: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  pendingBanner: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8 },
  pendingBannerText: { fontSize: 11, color: '#92400e', lineHeight: 16 },
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
  fullWidthBtn: { marginLeft: 0, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  selectedRow: { paddingHorizontal: 16, paddingTop: 12 },
  selectedText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  composeScroll: { padding: 16 },
  pickSection: { marginBottom: 20 },
  pickSectionLabel: { fontWeight: '700', color: colors.textPrimary, marginBottom: 10, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  groupChipText: { fontWeight: '700', fontSize: 12, color: colors.textPrimary },
  groupChipTextActive: { color: '#fff' },
  personGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  personCard: { width: 76, alignItems: 'center' },
  personAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  personAvatarWrapSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  personAvatar: { fontSize: 24 },
  personCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pendingPip: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: colors.background,
  },
  personName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  personSubtitle: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 1 },
  composeFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});

export default MessageInbox;

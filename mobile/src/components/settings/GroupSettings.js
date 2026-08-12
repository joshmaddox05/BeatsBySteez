import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import EmojiPicker from '../EmojiPicker';
import { groupEmojis, groupColors } from '../../data/emojiOptions';
import { colors } from '../../theme/colors';

const blankDraft = { name: '', icon: '🏆', color: groupColors[0].value };

const GroupSettings = () => {
  const { groups, cheerleaders, addGroup, updateGroup, deleteGroup, setGroupMembers, getGroupMembers } =
    useApp();

  const [draft, setDraft] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingMembersFor, setEditingMembersFor] = useState(null);

  const handleSave = () => {
    const name = draft.name.trim();
    if (!name) return;
    if (draft.id) {
      updateGroup(draft.id, { name, icon: draft.icon, color: draft.color });
    } else {
      addGroup(name, draft.icon, draft.color);
    }
    setDraft(null);
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteGroup(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((current) => (current === id ? null : current)), 3000);
    }
  };

  const toggleMember = (group, cheerleaderId) => {
    const current = getGroupMembers(group.id).map((c) => c.id);
    const next = current.includes(cheerleaderId)
      ? current.filter((id) => id !== cheerleaderId)
      : [...current, cheerleaderId];
    setGroupMembers(group.id, next);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Squad Groups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setDraft({ ...blankDraft })}>
          <Text style={styles.addBtnText}>+ New Group</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Split the squad however you run practice — Varsity and JV, stunt groups, tumbling levels. A
        cheerleader can be in as many groups as you like. Groups let you filter the squad and award a
        whole group at once.
      </Text>

      {draft && (
        <View style={styles.draft}>
          <Text style={styles.label}>Group name</Text>
          <TextInput
            style={styles.input}
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="e.g. Varsity"
            autoFocus
            maxLength={30}
          />

          <EmojiPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
            options={groupEmojis}
            label="Icon"
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.swatchRow}>
            {groupColors.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.swatch,
                  { backgroundColor: color.value },
                  draft.color === color.value && styles.swatchSelected,
                ]}
                onPress={() => setDraft({ ...draft, color: color.value })}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDraft(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !draft.name.trim() && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!draft.name.trim()}
            >
              <Text style={styles.submitBtnText}>{draft.id ? 'Save Group' : 'Add Group'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {groups.length === 0 ? (
        <Text style={styles.empty}>No groups yet. The squad shows as one list until you add one.</Text>
      ) : (
        groups.map((group) => {
          const members = getGroupMembers(group.id);
          const memberIds = members.map((c) => c.id);
          const open = editingMembersFor === group.id;
          return (
            <View key={group.id} style={[styles.groupCard, { borderLeftColor: group.color }]}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupIcon}>{group.icon}</Text>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: group.color }]}>{group.name}</Text>
                  <Text style={styles.groupCount}>
                    {members.length} {members.length === 1 ? 'cheerleader' : 'cheerleaders'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setEditingMembersFor(open ? null : group.id)}
                >
                  <Text style={styles.iconBtnText}>{open ? '▲' : '👥'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setDraft({ ...group })}>
                  <Text style={styles.iconBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, confirmDeleteId === group.id && styles.deleteBtnConfirm]}
                  onPress={() => handleDelete(group.id)}
                >
                  <Text style={styles.deleteBtnText}>
                    {confirmDeleteId === group.id ? 'Confirm' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>

              {open && (
                <View style={styles.memberPicker}>
                  {cheerleaders.length === 0 ? (
                    <Text style={styles.empty}>No cheerleaders on the squad yet.</Text>
                  ) : (
                    cheerleaders.map((c) => {
                      const selected = memberIds.includes(c.id);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.memberOption, selected && styles.memberOptionSelected]}
                          onPress={() => toggleMember(group, c.id)}
                        >
                          <Text style={styles.memberText}>
                            {c.avatar} {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 14 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  draft: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 14 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap' },
  swatch: { width: 36, height: 36, borderRadius: 18, marginRight: 10, marginBottom: 8 },
  swatchSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  empty: { color: colors.textSecondary, fontStyle: 'italic' },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center' },
  groupIcon: { fontSize: 22, marginRight: 10 },
  groupInfo: { flex: 1 },
  groupName: { fontWeight: '700' },
  groupCount: { color: colors.textSecondary, fontSize: 12 },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 15, color: colors.textSecondary },
  deleteBtn: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colors.negativeBg, marginLeft: 4 },
  deleteBtnConfirm: { backgroundColor: colors.danger },
  deleteBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 11 },
  memberPicker: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  memberOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  memberOptionSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  memberText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});

export default GroupSettings;

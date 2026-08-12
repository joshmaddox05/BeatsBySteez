import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import EmojiPicker from '../EmojiPicker';
import { tierEmojis } from '../../data/emojiOptions';
import { colors } from '../../theme/colors';

const blankDraft = { name: '', icon: '🌟', threshold: '25' };

const TierSettings = () => {
  const { rewardTiers, cheerleaders, addRewardTier, updateRewardTier, deleteRewardTier } = useApp();

  const [draft, setDraft] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const sorted = [...rewardTiers].sort((a, b) => a.threshold - b.threshold);

  // Who currently sits in each tier — the band from this threshold up to the
  // next one. Makes it obvious when a threshold is set somewhere nobody reaches.
  const membersInTier = (index) => {
    const floor = sorted[index].threshold;
    const ceiling = sorted[index + 1]?.threshold ?? Infinity;
    return cheerleaders.filter((c) => {
      const total = c.totalPoints ?? 0;
      return total >= floor && total < ceiling;
    });
  };

  const handleSave = () => {
    const name = draft.name.trim();
    if (!name) return;
    const threshold = Math.max(0, Number(draft.threshold) || 0);
    if (draft.id) {
      updateRewardTier(draft.id, { name, icon: draft.icon, threshold });
    } else {
      addRewardTier(name, draft.icon, threshold);
    }
    setDraft(null);
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteRewardTier(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((current) => (current === id ? null : current)), 3000);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Reward Tiers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setDraft({ ...blankDraft })}>
          <Text style={styles.addBtnText}>+ New Tier</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Name the levels your squad works toward. A cheerleader shows the highest level she has
        reached, on her card and in her own and her parent's view. Delete them all to turn the
        feature off.
      </Text>

      {draft && (
        <View style={styles.draft}>
          <Text style={styles.label}>Level name</Text>
          <TextInput
            style={styles.input}
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="e.g. Spirit Star"
            autoFocus
            maxLength={30}
          />

          <Text style={styles.label}>Points needed</Text>
          <TextInput
            style={styles.input}
            value={String(draft.threshold)}
            onChangeText={(threshold) => setDraft({ ...draft, threshold })}
            keyboardType="number-pad"
            maxLength={4}
          />

          <EmojiPicker
            value={draft.icon}
            onChange={(icon) => setDraft({ ...draft, icon })}
            options={tierEmojis}
            label="Badge"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDraft(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !draft.name.trim() && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!draft.name.trim()}
            >
              <Text style={styles.submitBtnText}>{draft.id ? 'Save Level' : 'Add Level'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {sorted.length === 0 ? (
        <Text style={styles.empty}>
          No reward levels. Cheerleaders just see their point total — add a level to give them
          something to aim at.
        </Text>
      ) : (
        sorted.map((tier, index) => {
          const members = membersInTier(index);
          return (
            <View key={tier.id} style={styles.row}>
              <Text style={styles.rowIcon}>{tier.icon}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{tier.name}</Text>
                <Text style={styles.rowThreshold}>{tier.threshold}+ points</Text>
                <Text style={styles.rowMembers} numberOfLines={2}>
                  {members.length === 0
                    ? 'Nobody here yet'
                    : members.map((m) => `${m.avatar} ${m.name.split(' ')[0]}`).join(', ')}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setDraft({ ...tier, threshold: String(tier.threshold) })}
                >
                  <Text style={styles.iconBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, confirmDeleteId === tier.id && styles.deleteBtnConfirm]}
                  onPress={() => handleDelete(tier.id)}
                >
                  <Text style={styles.deleteBtnText}>
                    {confirmDeleteId === tier.id ? 'Confirm' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  empty: { color: colors.textSecondary, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowIcon: { fontSize: 24, marginRight: 10 },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '700', color: colors.textPrimary },
  rowThreshold: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  rowMembers: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  rowActions: { alignItems: 'flex-end' },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 16, color: colors.textSecondary },
  deleteBtn: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colors.negativeBg },
  deleteBtnConfirm: { backgroundColor: colors.danger },
  deleteBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 11 },
});

export default TierSettings;

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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

// Award one category to several cheerleaders. The squad rules are applied per
// cheerleader, so this can legitimately succeed for some and not others — hence
// the results screen rather than a single "done" message.
const BulkAwardModal = ({ cheerleaders, type, onClose }) => {
  const { meritCategories, demeritCategories, bulkAwardPoints, squadRules } = useApp();

  const [targets, setTargets] = useState(cheerleaders);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [working, setWorking] = useState(false);

  const categories = type === 'merit' ? meritCategories : demeritCategories;
  const isMerit = type === 'merit';
  const noteMissing = squadRules.requireNoteOnDemerits && !isMerit && !note.trim();

  const removeTarget = (id) => setTargets((prev) => prev.filter((c) => c.id !== id));

  const handleAward = async () => {
    if (!selectedCategory || targets.length === 0 || working) return;
    setWorking(true);
    try {
      setOutcome(await bulkAwardPoints(targets.map((c) => c.id), selectedCategory, isMerit, note));
    } finally {
      setWorking(false);
    }
  };

  if (outcome) {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView bounces={false}>
              <Text style={styles.title}>
                {outcome.failCount === 0
                  ? isMerit
                    ? 'Merits Awarded!'
                    : 'Demerits Recorded'
                  : 'Partly Done'}
              </Text>
              <Text style={styles.categoryName}>
                {selectedCategory.icon} {selectedCategory.name}
              </Text>
              <Text style={styles.hint}>
                {outcome.successCount} of {outcome.successCount + outcome.failCount} went through.
              </Text>

              {outcome.results.map((result) => (
                <View key={result.cheerleaderId} style={styles.resultRow}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {result.name}
                  </Text>
                  {result.ok ? (
                    <Text
                      style={[
                        styles.resultDetail,
                        { color: result.applied > 0 ? colors.positiveText : colors.negativeText },
                      ]}
                    >
                      {result.applied > 0 ? '+' : ''}
                      {result.applied}
                      {(result.capped || result.clamped) && ' (reduced)'}
                    </Text>
                  ) : (
                    <Text style={styles.resultFail} numberOfLines={2}>
                      {result.message}
                    </Text>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.submitBtn} onPress={onClose}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <Text style={styles.title}>{isMerit ? 'Award Merit' : 'Give Demerit'}</Text>
                <Text style={styles.hint}>
                  {targets.length} {targets.length === 1 ? 'cheerleader' : 'cheerleaders'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Who's getting this</Text>
            <View style={styles.chipRow}>
              {targets.map((c) => (
                <TouchableOpacity key={c.id} style={styles.targetChip} onPress={() => removeTarget(c.id)}>
                  <Text style={styles.targetChipText}>
                    {c.avatar} {c.name} ×
                  </Text>
                </TouchableOpacity>
              ))}
              {targets.length === 0 && (
                <Text style={styles.hint}>Nobody left — close and pick again.</Text>
              )}
            </View>

            {categories.length === 0 ? (
              <Text style={styles.hint}>
                No {isMerit ? 'merit' : 'demerit'} categories yet. Add some in Settings → Categories.
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {categories.map((category) => {
                  const selected = selectedCategory?.id === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryLabel} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryPoints,
                          { color: category.points > 0 ? colors.positiveText : colors.negativeText },
                        ]}
                      >
                        {category.points > 0 ? '+' : ''}
                        {category.points}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>
              {squadRules.requireNoteOnDemerits && !isMerit
                ? 'Add a note (required)'
                : 'Add a note (optional)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="The same note is saved for everyone selected..."
              multiline
              textAlignVertical="top"
            />
            {noteMissing && <Text style={styles.error}>A note is required for demerits.</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: isMerit ? colors.success : colors.danger },
                  (!selectedCategory || targets.length === 0 || noteMissing || working) &&
                    styles.submitBtnDisabled,
                ]}
                onPress={handleAward}
                disabled={!selectedCategory || targets.length === 0 || noteMissing || working}
              >
                <Text style={styles.submitBtnText}>
                  {working ? 'Working…' : `${isMerit ? 'Award to' : 'Give to'} ${targets.length}`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { fontSize: 24, color: colors.textSecondary },
  categoryName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 6 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 12 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  error: { color: colors.negativeText, fontSize: 12, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  targetChip: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  targetChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  categoryBtn: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginRight: '2%',
    marginBottom: 8,
    alignItems: 'center',
  },
  categoryBtnSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },
  categoryPoints: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  textArea: { minHeight: 64 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  resultDetail: { fontWeight: '700', fontSize: 13, marginLeft: 8 },
  resultFail: { color: colors.textSecondary, fontSize: 11, flexShrink: 1, marginLeft: 8, textAlign: 'right' },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});

export default BulkAwardModal;

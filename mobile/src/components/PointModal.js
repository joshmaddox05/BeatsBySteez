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

const PointModal = ({ cheerleader, type, onClose }) => {
  const { meritCategories, demeritCategories, awardPoints } = useApp();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [awarded, setAwarded] = useState(false);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = type === 'merit' ? meritCategories : demeritCategories;
  const isMerit = type === 'merit';

  // The squad rules can reject or trim an award, so report what actually landed
  // rather than assuming the category's face value went through.
  const handleAward = async () => {
    if (!selectedCategory || saving) return;
    setSaving(true);
    setError('');
    try {
      const verdict = await awardPoints(cheerleader.id, selectedCategory, isMerit, note);
      if (!verdict?.ok) {
        setError(verdict?.message || 'That award could not be recorded.');
        return;
      }
      setApplied(verdict.applied);
      setAwarded(true);
      setTimeout(onClose, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          {awarded ? (
            <View style={styles.awardedContent}>
              <Text style={styles.awardedIcon}>{isMerit ? '🌟' : '📝'}</Text>
              <Text style={styles.awardedTitle}>{isMerit ? 'Merit Awarded!' : 'Demerit Recorded'}</Text>
              <Text style={styles.awardedText}>
                <Text style={{ fontWeight: '700' }}>{cheerleader.name}</Text> received{' '}
                <Text style={{ color: isMerit ? colors.positiveText : colors.negativeText, fontWeight: '700' }}>
                  {applied > 0 ? '+' : ''}
                  {applied} points
                </Text>
              </Text>
              <Text style={styles.awardedCategory}>
                {selectedCategory.icon} {selectedCategory.name}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerAvatar}>{cheerleader.avatar}</Text>
                <View>
                  <Text style={styles.headerTitle}>{isMerit ? 'Award Merit' : 'Give Demerit'}</Text>
                  <Text style={styles.headerName}>{cheerleader.name}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.grid}>
                {categories.map((category) => {
                  const selected = selectedCategory?.id === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={styles.catIcon}>{category.icon}</Text>
                      <Text style={styles.catName}>{category.name}</Text>
                      <Text style={{ color: category.points > 0 ? colors.positiveText : colors.negativeText, fontWeight: '700' }}>
                        {category.points > 0 ? '+' : ''}
                        {category.points}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Add a note (optional)</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add any additional details..."
                multiline
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: isMerit ? colors.success : colors.danger },
                    (!selectedCategory || saving) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleAward}
                  disabled={!selectedCategory || saving}
                >
                  <Text style={styles.submitBtnText}>
                    {saving ? 'Saving…' : isMerit ? 'Award Merit' : 'Give Demerit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerAvatar: { fontSize: 32, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  headerName: { color: colors.textSecondary },
  closeBtn: { marginLeft: 'auto', padding: 4 },
  closeBtnText: { fontSize: 24, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryBtn: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryBtnSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  catIcon: { fontSize: 22 },
  catName: { fontSize: 12, color: colors.textPrimary, textAlign: 'center', marginVertical: 4 },
  label: { fontWeight: '600', color: colors.textPrimary, marginTop: 8, marginBottom: 6 },
  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top' },
  error: { color: colors.negativeText, fontSize: 13, marginTop: 10 },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  awardedContent: { alignItems: 'center', paddingVertical: 20 },
  awardedIcon: { fontSize: 48, marginBottom: 12 },
  awardedTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  awardedText: { fontSize: 15, color: colors.textPrimary, marginBottom: 6 },
  awardedCategory: { color: colors.textSecondary },
});

export default PointModal;

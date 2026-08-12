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
import EmojiPicker from './EmojiPicker';
import { meritEmojis, demeritEmojis } from '../data/emojiOptions';
import { colors } from '../theme/colors';

// Create or edit one point category. The coach enters a plain magnitude and
// picks merit or demerit; the sign is applied for her.
const CategoryEditorModal = ({ category, defaultType = 'merit', onClose }) => {
  const { addCategory, updateCategory } = useApp();
  const editing = Boolean(category);

  // Stored categories carry isMerit; the editor works in merit/demerit terms.
  const initialType = category ? (category.isMerit ? 'merit' : 'demerit') : defaultType;

  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState(initialType);
  const [points, setPoints] = useState(String(Math.abs(category?.points ?? 5)));
  const [icon, setIcon] = useState(category?.icon || (initialType === 'merit' ? '⭐' : '⚠️'));

  const magnitude = Math.min(50, Math.max(1, Number(points) || 0));
  const signedPoints = type === 'demerit' ? -magnitude : magnitude;
  const canSave = name.trim().length > 0 && magnitude >= 1;

  const handleTypeChange = (nextType) => {
    setType(nextType);
    // Swap a still-default icon so a flipped category doesn't keep a star on a
    // demerit, but never clobber a deliberate pick.
    if (icon === '⭐' && nextType === 'demerit') setIcon('⚠️');
    if (icon === '⚠️' && nextType === 'merit') setIcon('⭐');
  };

  const handleSave = () => {
    if (!canSave) return;
    if (editing) {
      updateCategory(category.id, {
        name: name.trim(),
        icon,
        points: signedPoints,
        isMerit: type === 'merit',
      });
    } else {
      addCategory(name.trim(), magnitude, icon, type === 'merit');
    }
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{editing ? 'Edit Category' : 'New Category'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'merit' && styles.typeBtnMerit]}
                onPress={() => handleTypeChange('merit')}
              >
                <Text style={[styles.typeText, type === 'merit' && styles.typeTextActive]}>👍 Merit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'demerit' && styles.typeBtnDemerit]}
                onPress={() => handleTypeChange('demerit')}
              >
                <Text style={[styles.typeText, type === 'demerit' && styles.typeTextActive]}>
                  👎 Demerit
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={type === 'merit' ? 'e.g. Nailed Routine' : 'e.g. Late to Practice'}
              autoFocus
              maxLength={40}
            />

            <Text style={styles.label}>Points (1–50)</Text>
            <TextInput
              style={styles.input}
              value={points}
              onChangeText={setPoints}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.hint}>
              Saved as {signedPoints > 0 ? '+' : ''}
              {signedPoints} — {type === 'merit' ? 'added to' : 'taken off'} her total.
            </Text>

            <EmojiPicker
              value={icon}
              onChange={setIcon}
              options={type === 'merit' ? meritEmojis : demeritEmojis}
              label="Icon"
            />

            <Text style={styles.label}>Preview</Text>
            <View style={styles.preview}>
              <Text style={styles.previewIcon}>{icon}</Text>
              <Text style={styles.previewName}>{name.trim() || 'Category name'}</Text>
              <Text
                style={[
                  styles.previewPoints,
                  { color: signedPoints > 0 ? colors.positiveText : colors.negativeText },
                ]}
              >
                {signedPoints > 0 ? '+' : ''}
                {signedPoints}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, !canSave && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={styles.submitBtnText}>{editing ? 'Save Changes' : 'Add Category'}</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { fontSize: 24, color: colors.textSecondary },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  typeToggle: { flexDirection: 'row' },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginRight: 8,
  },
  typeBtnMerit: { borderColor: colors.success, backgroundColor: colors.positiveBg },
  typeBtnDemerit: { borderColor: colors.danger, backgroundColor: colors.negativeBg },
  typeText: { fontWeight: '600', color: colors.textSecondary },
  typeTextActive: { color: colors.textPrimary },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
  },
  previewIcon: { fontSize: 22, marginRight: 10 },
  previewName: { flex: 1, fontWeight: '600', color: colors.textPrimary },
  previewPoints: { fontWeight: '800' },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});

export default CategoryEditorModal;

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
import CheerleaderFields from './CheerleaderFields';
import { avatarOptions } from '../data/defaultCategories';
import { colors } from '../theme/colors';

const EditCheerleaderModal = ({ cheerleader, onClose }) => {
  const { updateCheerleader, regenerateParentCode, setCheerleaderGroups } = useApp();

  const [name, setName] = useState(cheerleader.name);
  const [avatar, setAvatar] = useState(cheerleader.avatar);
  const [position, setPosition] = useState(cheerleader.position || '');
  const [notes, setNotes] = useState(cheerleader.notes || '');
  const [groupIds, setGroupIds] = useState(cheerleader.groupIds || []);
  const [parentCode, setParentCode] = useState(cheerleader.parentCode);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleGroup = (id) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  // First tap arms, second confirms. The arm lapses so a stray tap cannot leave
  // the button primed for a destructive action.
  const handleRegenerate = async () => {
    if (confirmRegen) {
      setConfirmRegen(false);
      setParentCode(await regenerateParentCode(cheerleader.id, name));
    } else {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 3000);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await updateCheerleader(cheerleader.id, {
        name: name.trim(),
        avatar,
        position,
        notes: notes.trim(),
      });
      await setCheerleaderGroups(cheerleader.id, groupIds);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Edit {cheerleader.name.split(' ')[0]}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={40}
            />

            <EmojiPicker value={avatar} onChange={setAvatar} options={avatarOptions} label="Avatar" />

            <CheerleaderFields
              position={position}
              onPosition={setPosition}
              notes={notes}
              onNotes={setNotes}
              groupIds={groupIds}
              onToggleGroup={toggleGroup}
            />

            <Text style={styles.label}>Parent code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.code}>{parentCode}</Text>
              <TouchableOpacity
                style={[styles.regenBtn, confirmRegen && styles.regenBtnConfirm]}
                onPress={handleRegenerate}
              >
                <Text style={[styles.regenText, confirmRegen && styles.regenTextConfirm]}>
                  {confirmRegen ? 'Confirm — old code stops working' : 'Regenerate'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Regenerating takes effect immediately. Whoever has the old code will not be able to log
              in with it.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!name.trim() || saving) && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim() || saving}
              >
                <Text style={styles.submitBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
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
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  code: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
    marginRight: 12,
  },
  regenBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexShrink: 1,
  },
  regenBtnConfirm: { borderColor: colors.negativeText, backgroundColor: colors.negativeBg },
  regenText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  regenTextConfirm: { color: colors.negativeText },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});

export default EditCheerleaderModal;

import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { avatarOptions } from '../data/defaultCategories';
import { colors } from '../theme/colors';

const AddCheerleaderModal = ({ onClose }) => {
  const { addCheerleader } = useApp();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [newCheerleader, setNewCheerleader] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const cheerleader = await addCheerleader(name.trim(), selectedAvatar);
    setNewCheerleader(cheerleader);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          {newCheerleader ? (
            <View style={styles.successContent}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Cheerleader Added!</Text>
              <Text style={styles.newInfo}>
                {newCheerleader.avatar} {newCheerleader.name}
              </Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Share this code with the parent:</Text>
                <Text style={styles.codeValue}>{newCheerleader.parentCode}</Text>
                <Text style={styles.codeHint}>Parents use this code to sign up and view their child's progress</Text>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Add New Cheerleader</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeBtn}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter cheerleader's name"
                autoFocus
              />

              <Text style={styles.label}>Choose Avatar</Text>
              <View style={styles.avatarPicker}>
                {avatarOptions.map((avatar) => (
                  <TouchableOpacity
                    key={avatar}
                    style={[styles.avatarOption, selectedAvatar === avatar && styles.avatarOptionSelected]}
                    onPress={() => setSelectedAvatar(avatar)}
                  >
                    <Text style={styles.avatarOptionText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!name.trim()}
                >
                  <Text style={styles.submitBtnText}>Add Cheerleader</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { fontSize: 24, color: colors.textSecondary },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap' },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  avatarOptionSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  avatarOptionText: { fontSize: 22 },
  actions: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  successContent: { alignItems: 'center', paddingVertical: 10 },
  successIcon: { fontSize: 44, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  newInfo: { fontSize: 16, marginBottom: 14 },
  codeBox: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: 16, width: '100%' },
  codeLabel: { color: colors.textSecondary, marginBottom: 6 },
  codeValue: { fontSize: 24, fontWeight: '800', letterSpacing: 2, color: colors.primary, marginBottom: 6 },
  codeHint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  doneBtn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  doneBtnText: { color: '#fff', fontWeight: '700' },
});

export default AddCheerleaderModal;

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import CategoryEditorModal from '../CategoryEditorModal';
import { presetPacks } from '../../data/presetPacks';
import { colors } from '../../theme/colors';

const CategorySettings = () => {
  const { meritCategories, demeritCategories, deleteCategory, reorderCategory, loadPresetPack } =
    useApp();

  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingPack, setPendingPack] = useState(null);
  const [flash, setFlash] = useState(null);

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteCategory(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((current) => (current === id ? null : current)), 3000);
    }
  };

  const applyPack = async (mode) => {
    const pack = pendingPack;
    setPendingPack(null);
    const { added, removed } = await loadPresetPack(pack.id, mode);
    setFlash(
      mode === 'replace'
        ? `Replaced ${removed} categories with ${added} from ${pack.name}.`
        : `Added up to ${added} categories from ${pack.name}.`
    );
    setTimeout(() => setFlash(null), 4000);
  };

  const renderList = (categories, type) => (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.blockTitle}>
          {type === 'merit' ? '👍 Merits' : '👎 Demerits'} ({categories.length})
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setEditing({ defaultType: type })}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <Text style={styles.empty}>
          No {type === 'merit' ? 'merits' : 'demerits'} yet — cheerleaders can't be given any until
          you add one.
        </Text>
      ) : (
        categories.map((category, index) => (
          <View key={category.id} style={styles.row}>
            <View style={styles.reorder}>
              <TouchableOpacity
                onPress={() => reorderCategory(category.id, 'up')}
                disabled={index === 0}
              >
                <Text style={[styles.reorderBtn, index === 0 && styles.reorderDisabled]}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => reorderCategory(category.id, 'down')}
                disabled={index === categories.length - 1}
              >
                <Text
                  style={[
                    styles.reorderBtn,
                    index === categories.length - 1 && styles.reorderDisabled,
                  ]}
                >
                  ↓
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.rowIcon}>{category.icon}</Text>
            <Text style={styles.rowName} numberOfLines={1}>
              {category.name}
            </Text>
            <Text
              style={[
                styles.rowPoints,
                { color: category.points > 0 ? colors.positiveText : colors.negativeText },
              ]}
            >
              {category.points > 0 ? '+' : ''}
              {category.points}
            </Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing({ category })}>
              <Text style={styles.iconBtnText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, confirmDeleteId === category.id && styles.deleteBtnConfirm]}
              onPress={() => handleDelete(category.id)}
            >
              <Text style={styles.deleteBtnText}>
                {confirmDeleteId === category.id ? 'Confirm' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Merit &amp; Demerit Categories</Text>
      <Text style={styles.hint}>
        This is your point system — rename anything, change any value, add your own, or start from a
        preset below. Past awards keep whatever they were given as, so editing a category never
        rewrites history.
      </Text>

      {!!flash && <Text style={styles.flash}>{flash}</Text>}

      {renderList(meritCategories, 'merit')}
      {renderList(demeritCategories, 'demerit')}

      <Text style={styles.blockTitle}>Start From a Preset</Text>
      <Text style={styles.hint}>
        A preset is just a starting point — everything stays editable afterwards.
      </Text>

      {pendingPack && (
        <View style={styles.confirmBanner}>
          <Text style={styles.confirmText}>
            <Text style={styles.bold}>
              {pendingPack.icon} {pendingPack.name}
            </Text>{' '}
            has {pendingPack.categories.length} categories. Replace your current list, or add these
            alongside it?
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingPack(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => applyPack('append')}>
              <Text style={styles.submitBtnText}>Add Alongside</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, styles.replaceBtn]}
              onPress={() => applyPack('replace')}
            >
              <Text style={styles.submitBtnText}>Replace All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {presetPacks.map((pack) => (
        <TouchableOpacity
          key={pack.id}
          style={[styles.packCard, pendingPack?.id === pack.id && styles.packCardSelected]}
          onPress={() => setPendingPack(pack)}
        >
          <Text style={styles.packIcon}>{pack.icon}</Text>
          <View style={styles.packInfo}>
            <Text style={styles.packName}>{pack.name}</Text>
            <Text style={styles.packDescription}>{pack.description}</Text>
            <Text style={styles.packCount}>{pack.categories.length} categories</Text>
          </View>
        </TouchableOpacity>
      ))}

      {editing && (
        <CategoryEditorModal
          category={editing.category}
          defaultType={editing.defaultType}
          onClose={() => setEditing(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 12 },
  flash: {
    backgroundColor: colors.positiveBg,
    color: colors.positiveText,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  block: { marginBottom: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  blockTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  reorder: { marginRight: 8 },
  reorderBtn: { fontSize: 13, color: colors.textSecondary, lineHeight: 16 },
  reorderDisabled: { opacity: 0.25 },
  rowIcon: { fontSize: 18, marginRight: 8 },
  rowName: { flex: 1, color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  rowPoints: { fontWeight: '800', fontSize: 13, marginHorizontal: 8 },
  iconBtn: { padding: 4 },
  iconBtnText: { fontSize: 14, color: colors.textSecondary },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.negativeBg, marginLeft: 4 },
  deleteBtnConfirm: { backgroundColor: colors.danger },
  deleteBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 10 },
  confirmBanner: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  confirmText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700' },
  confirmActions: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 10, marginRight: 6 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  submitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  replaceBtn: { backgroundColor: colors.danger },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  packCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packCardSelected: { borderColor: colors.primary },
  packIcon: { fontSize: 26, marginRight: 12 },
  packInfo: { flex: 1 },
  packName: { fontWeight: '700', color: colors.textPrimary },
  packDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  packCount: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 4 },
});

export default CategorySettings;

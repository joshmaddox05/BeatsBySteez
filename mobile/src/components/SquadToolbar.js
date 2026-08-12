import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export const SORT_OPTIONS = [
  { id: 'points-desc', label: 'Most points' },
  { id: 'points-asc', label: 'Fewest points' },
  { id: 'name-asc', label: 'Name (A–Z)' },
  { id: 'recent', label: 'Recent activity' },
];

const SquadToolbar = ({
  search,
  onSearch,
  sortBy,
  onSort,
  groupFilter,
  onGroupFilter,
  groups,
  selectMode,
  onToggleSelectMode,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onBulkMerit,
  onBulkDemerit,
  visibleCount,
}) => (
  <View style={styles.wrap}>
    <View style={styles.topRow}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={onSearch}
        placeholder="Search cheerleaders..."
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <TouchableOpacity
        style={[styles.selectBtn, selectMode && styles.selectBtnActive]}
        onPress={onToggleSelectMode}
      >
        <Text style={[styles.selectBtnText, selectMode && styles.selectBtnTextActive]}>
          {selectMode ? 'Done' : '☑️ Select'}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Sort is a chip row rather than a <select> — one tap instead of a picker sheet. */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {SORT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[styles.chip, sortBy === option.id && styles.chipActive]}
          onPress={() => onSort(option.id)}
        >
          <Text style={[styles.chipText, sortBy === option.id && styles.chipTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {groups.length > 0 && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, !groupFilter && styles.chipActive]}
          onPress={() => onGroupFilter(null)}
        >
          <Text style={[styles.chipText, !groupFilter && styles.chipTextActive]}>Everyone</Text>
        </TouchableOpacity>
        {groups.map((group) => {
          const active = groupFilter === group.id;
          return (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.chip,
                { borderColor: group.color },
                active && { backgroundColor: group.color },
              ]}
              onPress={() => onGroupFilter(active ? null : group.id)}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : group.color }]}>
                {group.icon} {group.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}

    {selectMode && (
      <View style={styles.selectBar}>
        <Text style={styles.selectedCount}>
          {selectedIds.length} of {visibleCount} selected
        </Text>
        <View style={styles.bulkRow}>
          <TouchableOpacity style={styles.plainBtn} onPress={onSelectAll}>
            <Text style={styles.plainBtnText}>Select all</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.plainBtn}
            onPress={onClearSelection}
            disabled={selectedIds.length === 0}
          >
            <Text style={[styles.plainBtnText, selectedIds.length === 0 && styles.disabled]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.meritBtn, selectedIds.length === 0 && styles.disabled]}
            onPress={onBulkMerit}
            disabled={selectedIds.length === 0}
          >
            <Text style={styles.bulkBtnText}>+ Merit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demeritBtn, selectedIds.length === 0 && styles.disabled]}
            onPress={onBulkDemerit}
            disabled={selectedIds.length === 0}
          >
            <Text style={styles.bulkBtnText}>− Demerit</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  selectBtn: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  selectBtnTextActive: { color: '#fff' },
  chipRow: { paddingHorizontal: 12, paddingVertical: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  selectBar: { paddingHorizontal: 12, paddingBottom: 10 },
  selectedCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  plainBtn: { paddingVertical: 7, paddingHorizontal: 10 },
  plainBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  meritBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 4,
  },
  demeritBtn: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 6,
  },
  bulkBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.4 },
});

export default SquadToolbar;

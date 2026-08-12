import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

export const POSITION_OPTIONS = ['', 'Flyer', 'Base', 'Backspot', 'Frontspot', 'Tumbler', 'Dancer'];

// A stored value that is no longer in the list still needs to be selectable, or
// opening the editor would silently wipe it.
const withCurrent = (options, value) =>
  value && !options.includes(value) ? [...options, value] : options;

// Position / groups / notes. Shared so adding a cheerleader and editing one
// offer exactly the same fields. Web uses a <select> for position; on mobile a
// chip row avoids a picker modal stacked inside an already-modal sheet.
const CheerleaderFields = ({ position, onPosition, notes, onNotes, groupIds, onToggleGroup }) => {
  const { groups } = useApp();

  return (
    <>
      <Text style={styles.label}>Position</Text>
      <View style={styles.chipRow}>
        {withCurrent(POSITION_OPTIONS, position).map((option) => (
          <TouchableOpacity
            key={option || 'none'}
            style={[styles.chip, position === option && styles.chipSelected]}
            onPress={() => onPosition(option)}
          >
            <Text style={[styles.chipText, position === option && styles.chipTextSelected]}>
              {option || '— none —'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Groups</Text>
      {groups.length === 0 ? (
        <Text style={styles.hint}>No groups yet — create them in Settings → Groups.</Text>
      ) : (
        <View style={styles.chipRow}>
          {groups.map((group) => {
            const selected = groupIds.includes(group.id);
            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                  selected && group.color ? { borderColor: group.color } : null,
                ]}
                onPress={() => onToggleGroup(group.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {group.icon} {group.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Coach notes (private)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={onNotes}
        placeholder="Only you see this — injuries, goals, anything worth remembering."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  hint: { color: colors.textSecondary, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  textArea: { minHeight: 76 },
});

export default CheerleaderFields;

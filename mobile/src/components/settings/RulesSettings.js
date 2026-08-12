import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../theme/colors';

// Squad-wide rules. Saved as they change — a Save button here would be one more
// thing to forget, and every setting is individually reversible.
const RulesSettings = () => {
  const { squadRules, updateSquadRules } = useApp();
  // Held locally while typing so the field can be briefly empty without the
  // rule flipping to 0 on every keystroke.
  const [capText, setCapText] = useState(String(squadRules.dailyPointCap ?? 0));

  const commitCap = () => {
    const parsed = Math.max(0, Math.min(500, Number(capText) || 0));
    setCapText(String(parsed));
    updateSquadRules({ dailyPointCap: parsed });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Squad Rules</Text>
      <Text style={styles.hint}>
        These apply to every award, whether you give it from a card or in bulk.
      </Text>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Allow negative totals</Text>
          <Text style={styles.rowHint}>
            When off, a demerit can only take a cheerleader down to 0 — the rest is dropped instead
            of pushing her negative.
          </Text>
        </View>
        <Switch
          value={squadRules.allowNegativeTotals}
          onValueChange={(v) => updateSquadRules({ allowNegativeTotals: v })}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Require a note on demerits</Text>
          <Text style={styles.rowHint}>
            Demerits won't save without a short explanation. Parents and cheerleaders both see the
            note.
          </Text>
        </View>
        <Switch
          value={squadRules.requireNoteOnDemerits}
          onValueChange={(v) => updateSquadRules({ requireNoteOnDemerits: v })}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Daily point limit</Text>
          <Text style={styles.rowHint}>
            Most points one cheerleader can be given in a single day, counting merits and demerits
            together and ignoring the sign. An award that would go over is trimmed to what's left.
            Set to 0 for no limit.
          </Text>
        </View>
        <TextInput
          style={styles.capInput}
          value={capText}
          onChangeText={setCapText}
          onBlur={commitCap}
          onSubmitEditing={commitCap}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowLabel: { flex: 1, marginRight: 12 },
  rowTitle: { fontWeight: '700', color: colors.textPrimary },
  rowHint: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  capInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default RulesSettings;

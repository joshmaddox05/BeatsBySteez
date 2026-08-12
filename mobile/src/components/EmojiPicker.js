import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

// Matches the avatar picker in AddCheerleaderModal so every emoji chooser in
// the app looks and behaves the same way.
const EmojiPicker = ({ value, onChange, options, label = 'Pick an icon' }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.grid}>
      {options.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.option, value === emoji && styles.optionSelected]}
          onPress={() => onChange(emoji)}
        >
          <Text style={styles.optionText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  optionText: { fontSize: 20 },
});

export default EmojiPicker;

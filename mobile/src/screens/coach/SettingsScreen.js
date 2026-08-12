import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DashboardHeader from '../../components/DashboardHeader';
import CategorySettings from '../../components/settings/CategorySettings';
import TierSettings from '../../components/settings/TierSettings';
import GroupSettings from '../../components/settings/GroupSettings';
import RulesSettings from '../../components/settings/RulesSettings';
import SeasonSettings from '../../components/settings/SeasonSettings';
import { colors } from '../../theme/colors';

const SECTIONS = [
  { id: 'categories', label: '🏷️ Categories', Component: CategorySettings },
  { id: 'tiers', label: '🏆 Tiers', Component: TierSettings },
  { id: 'groups', label: '👯 Groups', Component: GroupSettings },
  { id: 'rules', label: '⚖️ Rules', Component: RulesSettings },
  { id: 'season', label: '📅 Season', Component: SeasonSettings },
];

const SettingsScreen = () => {
  const [section, setSection] = useState('categories');
  const Active = SECTIONS.find((s) => s.id === section).Component;

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="Settings" subtitle="Your point system" />

      <View style={styles.navWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.tab, section === s.id && styles.tabActive]}
              onPress={() => setSection(s.id)}
            >
              <Text style={[styles.tabText, section === s.id && styles.tabTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Active />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  navWrap: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  nav: { paddingHorizontal: 12, paddingVertical: 10 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  body: { paddingBottom: 40 },
});

export default SettingsScreen;

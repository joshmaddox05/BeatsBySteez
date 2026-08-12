import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const DashboardHeader = ({ title, subtitle }) => {
  const { logout } = useApp();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.appName}>📣 Cheer Merit Tracker</Text>
        {!!title && <Text style={styles.title}>{title}</Text>}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  left: { flex: 1 },
  appName: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.negativeBg },
  logoutBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 12 },
});

export default DashboardHeader;

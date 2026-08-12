import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const authStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: colors.primary, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, marginBottom: 20 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.card },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  errorText: { color: colors.negativeText, marginTop: 12 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  roleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  roleIcon: { fontSize: 26, marginBottom: 6 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  roleDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});

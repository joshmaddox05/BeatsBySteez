import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

const WelcomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>
      <Text style={styles.title}>📣 Cheer Merit Tracker</Text>
      <Text style={styles.subtitle}>Track merits and demerits for your cheer squad</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.primaryBtnText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SignUpRole')}>
        <Text style={styles.secondaryBtnText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 40, textAlign: 'center' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});

export default WelcomeScreen;

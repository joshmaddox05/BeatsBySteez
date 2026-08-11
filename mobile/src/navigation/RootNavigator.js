import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import AuthNavigator from './AuthNavigator';
import CoachTabs from './CoachTabs';
import CheerleaderTabs from './CheerleaderTabs';
import ParentTabs from './ParentTabs';
import { colors } from '../theme/colors';

const RootNavigator = () => {
  const { sessionLoading, currentUser, userRole } = useApp();

  if (sessionLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      {!currentUser && <AuthNavigator />}
      {currentUser && userRole === 'coach' && <CoachTabs />}
      {currentUser && userRole === 'cheerleader' && <CheerleaderTabs />}
      {currentUser && userRole === 'parent' && <ParentTabs />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.textSecondary },
});

export default RootNavigator;

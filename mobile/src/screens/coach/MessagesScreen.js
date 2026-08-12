import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import DashboardHeader from '../../components/DashboardHeader';
import MessageInbox from '../../components/MessageInbox';
import { colors } from '../../theme/colors';

const MessagesScreen = () => {
  const { currentUser, getUnreadCount } = useApp();
  const unread = getUnreadCount(currentUser?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader
        title="Messages"
        subtitle={unread > 0 ? `${unread} unread` : 'From parents and cheerleaders'}
      />
      <MessageInbox />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});

export default MessagesScreen;

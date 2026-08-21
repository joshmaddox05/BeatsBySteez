import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

const AnnouncementSection = ({ isCoach = false }) => {
  const { announcements } = useApp();

  return (
    <View>
      {isCoach && <PostComposer />}

      {announcements.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No announcements yet.</Text>
          {isCoach && <Text style={styles.emptyText}>Create one to share news with your team!</Text>}
        </View>
      ) : (
        announcements.map((post) => <PostCard key={post.id} post={post} isCoach={isCoach} />)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
});

export default AnnouncementSection;

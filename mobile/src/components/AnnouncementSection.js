import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const AnnouncementSection = ({ isCoach = false }) => {
  const { announcements, addAnnouncement, removeAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title.trim(), content.trim());
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  return (
    <View>
      {isCoach && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ New Announcement'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showForm && isCoach && (
        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Announcement title" />
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={setContent}
            placeholder="Write your announcement..."
            multiline
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Post Announcement</Text>
          </TouchableOpacity>
        </View>
      )}

      {announcements.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No announcements yet.</Text>
          {isCoach && <Text style={styles.emptyText}>Create one to share news with your team!</Text>}
        </View>
      ) : (
        announcements.map((announcement) => (
          <View key={announcement.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{announcement.title}</Text>
              {isCoach && (
                <TouchableOpacity onPress={() => removeAnnouncement(announcement.id)}>
                  <Text style={styles.deleteBtn}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cardContent}>{announcement.content}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>Posted by {announcement.author}</Text>
              <Text style={styles.metaText}>{formatDate(announcement.timestamp)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: { marginBottom: 12 },
  addBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  form: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 14 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  deleteBtn: { fontSize: 20, color: colors.textSecondary, marginLeft: 8 },
  cardContent: { color: colors.textPrimary, marginTop: 6 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaText: { color: colors.textSecondary, fontSize: 11 },
});

export default AnnouncementSection;

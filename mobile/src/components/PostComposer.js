import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const PostComposer = () => {
  const { addAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaAsset, setMediaAsset] = useState(null);
  const [posting, setPosting] = useState(false);

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach media to an announcement.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setMediaAsset(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || posting) return;
    setPosting(true);
    try {
      await addAnnouncement(title.trim(), content.trim(), mediaAsset);
      setTitle('');
      setContent('');
      setMediaAsset(null);
      setShowForm(false);
    } catch (e) {
      Alert.alert('Could not post', 'Something went wrong posting your announcement. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ New Announcement'}</Text>
      </TouchableOpacity>

      {showForm && (
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

          {mediaAsset ? (
            <View style={styles.mediaPreviewWrap}>
              {mediaAsset.type === 'video' ? (
                <View style={styles.videoPreviewPlaceholder}>
                  <Text style={styles.videoPreviewText}>🎬 Video attached</Text>
                </View>
              ) : (
                <Image source={{ uri: mediaAsset.uri }} style={styles.mediaPreview} />
              )}
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMediaAsset(null)}>
                <Text style={styles.removeMediaBtnText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.mediaBtn} onPress={pickMedia}>
              <Text style={styles.mediaBtnText}>📷 Add Photo or Video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (posting || !title.trim() || !content.trim()) && styles.disabled]}
            onPress={handleSubmit}
            disabled={posting || !title.trim() || !content.trim()}
          >
            {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Announcement</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: { marginBottom: 12 },
  addBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  form: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 12 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.textPrimary },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  mediaBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mediaBtnText: { color: colors.textSecondary, fontWeight: '600' },
  mediaPreviewWrap: { marginTop: 12, alignSelf: 'flex-start', position: 'relative' },
  mediaPreview: { width: 120, height: 120, borderRadius: 10, backgroundColor: colors.border },
  videoPreviewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: { color: colors.textPrimary, fontWeight: '600', fontSize: 12 },
  removeMediaBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaBtnText: { color: '#fff', fontWeight: '700', lineHeight: 18 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});

export default PostComposer;

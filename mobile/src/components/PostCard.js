import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';
import CommentThread from './CommentThread';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// A separate component so useVideoPlayer's hook only runs for posts that
// actually have a video attached.
const PostVideo = ({ uri }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView style={styles.media} player={player} nativeControls contentFit="contain" />;
};

const PostCard = ({ post, isCoach }) => {
  const { currentUser, toggleLike, removeAnnouncement } = useApp();
  const [showComments, setShowComments] = useState(false);

  const media = (post.media || [])[0];
  const likedBy = post.likedBy || [];
  const isLiked = currentUser ? likedBy.includes(currentUser.id) : false;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{post.title}</Text>
        {isCoach && (
          <TouchableOpacity onPress={() => removeAnnouncement(post.id)}>
            <Text style={styles.deleteBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.cardContent}>{post.content}</Text>

      {media && (
        <View style={styles.mediaWrap}>
          {media.type === 'video' ? (
            <PostVideo uri={media.url} />
          ) : (
            <Image source={{ uri: media.url }} style={styles.media} resizeMode="contain" />
          )}
        </View>
      )}

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>Posted by {post.author}</Text>
        <Text style={styles.metaText}>{formatDate(post.timestamp)}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
          <Text style={[styles.actionBtnText, isLiked && styles.likedText]}>
            {isLiked ? '❤️' : '🤍'} {likedBy.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments((v) => !v)}>
          <Text style={styles.actionBtnText}>💬 {post.commentCount || 0} comments</Text>
        </TouchableOpacity>
      </View>

      {showComments && <CommentThread postId={post.id} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  deleteBtn: { fontSize: 20, color: colors.textSecondary, marginLeft: 8 },
  cardContent: { color: colors.textPrimary, marginTop: 6 },
  mediaWrap: { marginTop: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.background },
  media: { width: '100%', aspectRatio: 16 / 9 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaText: { color: colors.textSecondary, fontSize: 11 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { marginRight: 20 },
  actionBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  likedText: { color: colors.danger },
});

export default PostCard;

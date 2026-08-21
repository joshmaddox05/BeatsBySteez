import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';

const formatTime = (timestamp) => {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) return 'Just now';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Owns its own listener (only mounted while a post's comments are expanded)
// rather than being centralized in AppContext, since most posts only need
// the denormalized `commentCount` shown on the card.
const CommentThread = ({ postId }) => {
  const { squad, currentUser, userRole, addPostComment, removePostComment } = useApp();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, authorName } of a top-level comment
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!squad?.id) return undefined;
    const unsubscribe = onSnapshot(
      query(collection(db, 'squads', squad.id, 'announcements', postId, 'comments'), orderBy('timestamp', 'asc')),
      (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsubscribe;
  }, [squad?.id, postId]);

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesFor = (commentId) => comments.filter((c) => c.parentCommentId === commentId);
  const canDelete = (comment) => comment.authorId === currentUser?.id || userRole === 'coach';

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addPostComment(postId, newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !replyTo || submitting) return;
    setSubmitting(true);
    try {
      await addPostComment(postId, replyText.trim(), replyTo.id);
      setReplyText('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment, isReply) => (
    <View key={comment.id} style={[styles.comment, isReply && styles.reply]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
        <Text style={styles.commentTime}>{formatTime(comment.timestamp)}</Text>
      </View>
      <Text style={styles.commentText}>{comment.content}</Text>
      <View style={styles.commentActionsRow}>
        {!isReply && (
          <TouchableOpacity onPress={() => setReplyTo({ id: comment.id, authorName: comment.authorName })}>
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        )}
        {canDelete(comment) && (
          <TouchableOpacity onPress={() => removePostComment(postId, comment.id)}>
            <Text style={[styles.commentActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {topLevel.length === 0 ? (
        <Text style={styles.empty}>No comments yet. Be the first to say something!</Text>
      ) : (
        topLevel.map((comment) => (
          <View key={comment.id}>
            {renderComment(comment, false)}
            {repliesFor(comment.id).map((reply) => renderComment(reply, true))}
          </View>
        ))
      )}

      {replyTo && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={`Reply to ${replyTo.authorName}...`}
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
          <TouchableOpacity onPress={submitReply} disabled={!replyText.trim() || submitting}>
            <Text style={[styles.sendText, (!replyText.trim() || submitting) && styles.disabledText]}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setReplyTo(null);
              setReplyText('');
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity onPress={submitComment} disabled={!newComment.trim() || submitting}>
          <Text style={[styles.sendText, (!newComment.trim() || submitting) && styles.disabledText]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  empty: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  comment: { marginBottom: 10 },
  reply: { marginLeft: 24, marginTop: 6 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  commentAuthor: { fontWeight: '700', color: colors.textPrimary, fontSize: 13 },
  commentTime: { color: colors.textSecondary, fontSize: 11 },
  commentText: { color: colors.textPrimary, fontSize: 13, marginTop: 2 },
  commentActionsRow: { flexDirection: 'row', marginTop: 4 },
  commentActionText: { color: colors.primary, fontSize: 12, fontWeight: '600', marginRight: 16 },
  deleteText: { color: colors.danger },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13,
  },
  sendText: { color: colors.primary, fontWeight: '700', marginLeft: 12 },
  cancelText: { color: colors.textSecondary, fontWeight: '600', marginLeft: 12 },
  disabledText: { opacity: 0.5 },
});

export default CommentThread;

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import TierBadge from './TierBadge';
import TierProgress from './TierProgress';
import EditCheerleaderModal from './EditCheerleaderModal';
import { colors } from '../theme/colors';

const CheerleaderCard = ({ cheerleader, onMerit, onDemerit, isCoach }) => {
  const { getCheerleaderHistory, removeCheerleader, getGroupsFor } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const memberGroups = getGroupsFor(cheerleader.id);

  const history = getCheerleaderHistory(cheerleader.id).slice(0, 5);
  const isPositive = cheerleader.totalPoints >= 0;

  const handleDelete = () => {
    if (confirmDelete) {
      removeCheerleader(cheerleader.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardMain} onPress={() => setShowDetails(!showDetails)} activeOpacity={0.7}>
        <Text style={styles.avatar}>{cheerleader.avatar}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{cheerleader.name}</Text>
          <Text style={[styles.points, { color: isPositive ? colors.positiveText : colors.negativeText }]}>
            {isPositive ? '+' : ''}
            {cheerleader.totalPoints} points
          </Text>
          <View style={styles.metaRow}>
            <TierBadge points={cheerleader.totalPoints} size="sm" />
            {memberGroups.map((group) => (
              <View key={group.id} style={[styles.groupChip, group.color ? { borderColor: group.color } : null]}>
                <Text style={styles.groupChipText}>
                  {group.icon} {group.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {isCoach && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.meritBtn} onPress={onMerit}>
              <Text style={styles.actionBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demeritBtn} onPress={onDemerit}>
              <Text style={styles.actionBtnText}>−</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.details}>
          <TierProgress points={cheerleader.totalPoints} />

          {!!cheerleader.position && (
            <Text style={styles.position}>Position: {cheerleader.position}</Text>
          )}

          <Text style={styles.detailsTitle}>Recent Activity</Text>
          {history.length > 0 ? (
            history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyIcon}>{entry.category.icon}</Text>
                <Text style={styles.historyCategory}>{entry.category.name}</Text>
                <Text style={{ color: entry.points > 0 ? colors.positiveText : colors.negativeText }}>
                  {entry.points > 0 ? '+' : ''}
                  {entry.points}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noHistory}>No activity yet</Text>
          )}

          {isCoach && (
            <View style={styles.footer}>
              <Text style={styles.parentCode}>
                Parent Code: <Text style={styles.parentCodeValue}>{cheerleader.parentCode}</Text>
              </Text>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, confirmDelete && styles.deleteBtnConfirm]}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteBtnText}>{confirmDelete ? 'Tap to Confirm' : 'Remove'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {showEdit && (
        <EditCheerleaderModal cheerleader={cheerleader} onClose={() => setShowEdit(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { fontSize: 36, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  points: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  quickActions: { flexDirection: 'row' },
  meritBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  demeritBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  details: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border },
  detailsTitle: { fontWeight: '700', color: colors.textPrimary, marginTop: 10, marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  historyIcon: { marginRight: 6 },
  historyCategory: { flex: 1, color: colors.textSecondary },
  noHistory: { color: colors.textSecondary, fontStyle: 'italic' },
  footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parentCode: { color: colors.textSecondary, fontSize: 12 },
  parentCodeValue: { fontWeight: '700', color: colors.textPrimary },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.negativeBg },
  deleteBtnConfirm: { backgroundColor: colors.danger },
  deleteBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 12 },
  footerActions: { flexDirection: 'row', alignItems: 'center' },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  editBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  groupChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
    marginTop: 2,
  },
  groupChipText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  position: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
});

export default CheerleaderCard;

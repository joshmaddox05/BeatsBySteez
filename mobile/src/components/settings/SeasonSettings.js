import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../theme/colors';

const formatDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SeasonSettings = () => {
  const { currentSeason, seasons, cheerleaders, pointHistory, startNewSeason, deleteArchivedSeason } =
    useApp();

  const [newName, setNewName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [working, setWorking] = useState(false);

  // Live history is always the current season's — past seasons are archived
  // into their own subcollection when a new one starts.
  const currentEntryCount = pointHistory.length;

  const handleStart = async () => {
    if (working) return;
    setWorking(true);
    try {
      const { archived, current } = await startNewSeason(newName);
      setNewName('');
      setConfirming(false);
      setFlash(
        `${archived ? `${archived.name} archived. ` : ''}${current.name} has started with everyone at 0.`
      );
      setTimeout(() => setFlash(null), 5000);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteArchivedSeason(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((current) => (current === id ? null : current)), 3000);
    }
  };

  if (!currentSeason) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Season</Text>
        <Text style={styles.empty}>No season started yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Season</Text>
      <Text style={styles.hint}>
        Starting a new season files the current standings away and puts everyone back at 0, so a
        fresh competition season or semester starts even. Past awards are archived under the season
        they happened in.
      </Text>

      {!!flash && <Text style={styles.flash}>{flash}</Text>}

      <View style={styles.currentCard}>
        <Text style={styles.chip}>Current</Text>
        <Text style={styles.currentName}>{currentSeason.name}</Text>
        <Text style={styles.currentMeta}>
          Started {formatDate(currentSeason.startedAt)} · {currentEntryCount}{' '}
          {currentEntryCount === 1 ? 'award' : 'awards'} · {cheerleaders.length}{' '}
          {cheerleaders.length === 1 ? 'cheerleader' : 'cheerleaders'}
        </Text>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.blockTitle}>Start a New Season</Text>
        {!confirming ? (
          <>
            <Text style={styles.label}>New season name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder={`e.g. Fall ${new Date().getFullYear()}`}
              maxLength={40}
            />
            <TouchableOpacity style={styles.dangerBtn} onPress={() => setConfirming(true)}>
              <Text style={styles.dangerBtnText}>Start New Season</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.confirmBanner}>
            <Text style={styles.confirmText}>
              <Text style={styles.bold}>Reset every cheerleader to 0 points?</Text>{' '}
              {currentSeason.name} will be archived with the current standings, and{' '}
              <Text style={styles.bold}>
                {newName.trim() || `Season ${seasons.length + 2}`}
              </Text>{' '}
              will begin. All {currentEntryCount} past awards are kept in the archive.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirming(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerBtn, working && styles.disabled]}
                onPress={handleStart}
                disabled={working}
              >
                <Text style={styles.dangerBtnText}>
                  {working ? 'Working…' : 'Yes, Start New Season'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.blockTitle}>Past Seasons</Text>
      {seasons.length === 0 ? (
        <Text style={styles.empty}>No past seasons yet.</Text>
      ) : (
        seasons.map((season) => (
          <View key={season.id} style={styles.archiveItem}>
            <View style={styles.archiveHeader}>
              <TouchableOpacity
                style={styles.archiveToggle}
                onPress={() => setExpanded(expanded === season.id ? null : season.id)}
              >
                <Text style={styles.archiveName}>{season.name}</Text>
                <Text style={styles.archiveMeta}>
                  {formatDate(season.startedAt)} – {formatDate(season.endedAt)} ·{' '}
                  {season.entryCount} {season.entryCount === 1 ? 'award' : 'awards'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.caret}>{expanded === season.id ? '▲' : '▼'}</Text>
              <TouchableOpacity
                style={[styles.deleteBtn, confirmDeleteId === season.id && styles.deleteBtnConfirm]}
                onPress={() => handleDelete(season.id)}
              >
                <Text style={styles.deleteBtnText}>
                  {confirmDeleteId === season.id ? 'Confirm' : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>

            {expanded === season.id && (
              <View style={styles.standings}>
                {(season.standings || []).length === 0 ? (
                  <Text style={styles.empty}>No standings were recorded.</Text>
                ) : (
                  season.standings.map((row, index) => (
                    <View key={row.cheerleaderId} style={styles.standingRow}>
                      <Text style={styles.rank}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </Text>
                      <Text style={styles.standingAvatar}>{row.avatar}</Text>
                      <Text style={styles.standingName} numberOfLines={1}>
                        {row.name}
                      </Text>
                      {!!row.tierName && <Text style={styles.tierName}>{row.tierName}</Text>}
                      <Text
                        style={[
                          styles.standingPoints,
                          { color: row.totalPoints >= 0 ? colors.positiveText : colors.negativeText },
                        ]}
                      >
                        {row.totalPoints >= 0 ? '+' : ''}
                        {row.totalPoints}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 12 },
  blockTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 8, marginBottom: 8 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.card },
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  flash: {
    backgroundColor: colors.positiveBg,
    color: colors.positiveText,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  currentCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    color: colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  currentName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 6 },
  currentMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  dangerZone: {
    borderWidth: 1,
    borderColor: colors.negativeBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.6 },
  confirmBanner: { marginTop: 4 },
  confirmText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700' },
  confirmActions: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 8, marginTop: 12 },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  archiveItem: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  archiveHeader: { flexDirection: 'row', alignItems: 'center' },
  archiveToggle: { flex: 1 },
  archiveName: { fontWeight: '700', color: colors.textPrimary },
  archiveMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  caret: { color: colors.textSecondary, fontSize: 11, marginHorizontal: 8 },
  deleteBtn: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colors.negativeBg },
  deleteBtnConfirm: { backgroundColor: colors.danger },
  deleteBtnText: { color: colors.negativeText, fontWeight: '600', fontSize: 11 },
  standings: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  standingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rank: { width: 30, fontSize: 12, color: colors.textSecondary },
  standingAvatar: { fontSize: 16, marginRight: 6 },
  standingName: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  tierName: { color: colors.primary, fontSize: 10, fontWeight: '600', marginRight: 8 },
  standingPoints: { fontWeight: '700', fontSize: 13 },
});

export default SeasonSettings;

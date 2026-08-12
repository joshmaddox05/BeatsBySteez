import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import CheerleaderCard from '../../components/CheerleaderCard';
import AddCheerleaderModal from '../../components/AddCheerleaderModal';
import PointModal from '../../components/PointModal';
import BulkAwardModal from '../../components/BulkAwardModal';
import DashboardHeader from '../../components/DashboardHeader';
import CoachStatHeader from '../../components/CoachStatHeader';
import SquadToolbar from '../../components/SquadToolbar';
import { colors } from '../../theme/colors';

const SquadScreen = () => {
  const { cheerleaders, squad, groups, pointHistory, currentSeason } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCheerleader, setSelectedCheerleader] = useState(null);
  const [pointModalType, setPointModalType] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points-desc');
  const [groupFilter, setGroupFilter] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkType, setBulkType] = useState(null);

  // Most recent award per cheerleader, for the "Recent activity" sort.
  const lastActivity = useMemo(() => {
    const map = new Map();
    pointHistory.forEach((entry) => {
      if (!map.has(entry.cheerleaderId)) map.set(entry.cheerleaderId, entry.timestamp);
    });
    return map;
  }, [pointHistory]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = cheerleaders.filter((c) => {
      const matchesSearch = !term || c.name.toLowerCase().includes(term);
      const matchesGroup = !groupFilter || (c.groupIds || []).includes(groupFilter);
      return matchesSearch && matchesGroup;
    });

    const sorted = [...filtered];
    if (sortBy === 'points-desc') sorted.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    else if (sortBy === 'points-asc') sorted.sort((a, b) => (a.totalPoints || 0) - (b.totalPoints || 0));
    else if (sortBy === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'recent') {
      sorted.sort((a, b) => {
        const aTime = lastActivity.get(a.id) || '';
        const bTime = lastActivity.get(b.id) || '';
        return bTime.localeCompare(aTime);
      });
    }
    return sorted;
  }, [cheerleaders, search, groupFilter, sortBy, lastActivity]);

  const handleAwardPoint = (cheerleader, type) => {
    setSelectedCheerleader(cheerleader);
    setPointModalType(type);
  };

  const closePointModal = () => {
    setSelectedCheerleader(null);
    setPointModalType(null);
  };

  const toggleSelected = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const bulkTargets = cheerleaders.filter((c) => selectedIds.includes(c.id));

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="My Squad" subtitle={squad?.name} />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <CoachStatHeader
              cheerleaders={cheerleaders}
              pointHistory={pointHistory}
              currentSeason={currentSeason}
            />

            {!!squad?.inviteCode && (
              <View style={styles.inviteBanner}>
                <Text style={styles.inviteLabel}>Squad Invite Code</Text>
                <Text style={styles.inviteCode}>{squad.inviteCode}</Text>
                <Text style={styles.inviteHint}>Share this so cheerleaders/parents can sign up</Text>
              </View>
            )}

            <SquadToolbar
              search={search}
              onSearch={setSearch}
              sortBy={sortBy}
              onSort={setSortBy}
              groupFilter={groupFilter}
              onGroupFilter={setGroupFilter}
              groups={groups}
              selectMode={selectMode}
              onToggleSelectMode={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              selectedIds={selectedIds}
              onSelectAll={() => setSelectedIds(visible.map((c) => c.id))}
              onClearSelection={() => setSelectedIds([])}
              onBulkMerit={() => setBulkType('merit')}
              onBulkDemerit={() => setBulkType('demerit')}
              visibleCount={visible.length}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {visible.length}
                {visible.length !== cheerleaders.length ? ` of ${cheerleaders.length}` : ''} cheerleaders
              </Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) =>
          selectMode ? (
            <TouchableOpacity
              style={[styles.selectRow, selectedIds.includes(item.id) && styles.selectRowActive]}
              onPress={() => toggleSelected(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.checkbox}>{selectedIds.includes(item.id) ? '☑️' : '⬜️'}</Text>
              <Text style={styles.selectAvatar}>{item.avatar}</Text>
              <Text style={styles.selectName}>{item.name}</Text>
              <Text style={styles.selectPoints}>{item.totalPoints || 0}</Text>
            </TouchableOpacity>
          ) : (
            <CheerleaderCard
              cheerleader={item}
              isCoach
              onMerit={() => handleAwardPoint(item, 'merit')}
              onDemerit={() => handleAwardPoint(item, 'demerit')}
            />
          )
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {cheerleaders.length === 0
              ? 'No cheerleaders yet. Add your first one!'
              : 'Nobody matches that search or filter.'}
          </Text>
        }
      />

      {showAddModal && <AddCheerleaderModal onClose={() => setShowAddModal(false)} />}
      {selectedCheerleader && pointModalType && (
        <PointModal cheerleader={selectedCheerleader} type={pointModalType} onClose={closePointModal} />
      )}
      {bulkType && (
        <BulkAwardModal
          cheerleaders={bulkTargets}
          type={bulkType}
          onClose={() => {
            setBulkType(null);
            exitSelectMode();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inviteBanner: {
    marginHorizontal: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  inviteLabel: { color: colors.textSecondary, fontSize: 12 },
  inviteCode: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
  inviteHint: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 30 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectRowActive: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  checkbox: { fontSize: 16, marginRight: 10 },
  selectAvatar: { fontSize: 22, marginRight: 8 },
  selectName: { flex: 1, fontWeight: '600', color: colors.textPrimary },
  selectPoints: { fontWeight: '700', color: colors.textSecondary },
});

export default SquadScreen;

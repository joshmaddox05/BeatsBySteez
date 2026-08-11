import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import CheerleaderCard from '../../components/CheerleaderCard';
import AddCheerleaderModal from '../../components/AddCheerleaderModal';
import PointModal from '../../components/PointModal';
import DashboardHeader from '../../components/DashboardHeader';
import { colors } from '../../theme/colors';

const SquadScreen = () => {
  const { cheerleaders, squad } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCheerleader, setSelectedCheerleader] = useState(null);
  const [pointModalType, setPointModalType] = useState(null);

  const handleAwardPoint = (cheerleader, type) => {
    setSelectedCheerleader(cheerleader);
    setPointModalType(type);
  };

  const closePointModal = () => {
    setSelectedCheerleader(null);
    setPointModalType(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DashboardHeader title="My Squad" subtitle={squad?.name} />

      {!!squad?.inviteCode && (
        <View style={styles.inviteBanner}>
          <Text style={styles.inviteLabel}>Squad Invite Code</Text>
          <Text style={styles.inviteCode}>{squad.inviteCode}</Text>
          <Text style={styles.inviteHint}>Share this so cheerleaders/parents can sign up</Text>
        </View>
      )}

      <FlatList
        data={cheerleaders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{cheerleaders.length} cheerleaders</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <CheerleaderCard
            cheerleader={item}
            isCoach
            onMerit={() => handleAwardPoint(item, 'merit')}
            onDemerit={() => handleAwardPoint(item, 'demerit')}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No cheerleaders yet. Add your first one!</Text>}
      />

      {showAddModal && <AddCheerleaderModal onClose={() => setShowAddModal(false)} />}
      {selectedCheerleader && pointModalType && (
        <PointModal cheerleader={selectedCheerleader} type={pointModalType} onClose={closePointModal} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inviteBanner: { marginHorizontal: 16, backgroundColor: '#eef2ff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center' },
  inviteLabel: { color: colors.textSecondary, fontSize: 12 },
  inviteCode: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
  inviteHint: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 30 },
});

export default SquadScreen;

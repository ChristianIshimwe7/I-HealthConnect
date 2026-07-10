import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { StatCard, RiskBadge } from '../components';
import { getDashboardStats, getRecentPatients } from '../db/database';

interface Stats { screened:number; highRisk:number; referrals:number; offline:number; }
interface Patient {
  id:number; name:string; age:number; gestational_age:number;
  overall_score:number; risk_tier:string; visit_date:string;
}

const getTier = (tier: string): 'high'|'elevated'|'low' =>
  tier === 'high' ? 'high' : tier === 'elevated' ? 'elevated' : 'low';

const getBadgeLabel = (tier: string) =>
  tier === 'high' ? 'High risk' : tier === 'elevated' ? 'Monitor' : 'Low risk';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<Stats>({ screened:0, highRisk:0, referrals:0, offline:0 });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [s, p] = await Promise.all([getDashboardStats(), getRecentPatients(8)]);
    setStats(s);
    setPatients(p as Patient[]);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>I-HealthConnect</Text>
          <Text style={styles.headerSub}>Kigali District · CHW Portal</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>CK</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green}/>}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard label="Screened today" value={stats.screened} />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="High risk flagged" value={stats.highRisk} valueColor={Colors.amberText} />
          </View>
          <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
            <StatCard label="Referrals sent" value={stats.referrals} valueColor="#86EFAC" />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Offline records" value={stats.offline} />
          </View>
        </View>

        {/* Recent Patients */}
        <Text style={styles.sectionLabel}>RECENT PATIENTS</Text>
        {patients.length === 0
          ? <Text style={styles.emptyText}>No patients yet. Start a new screening.</Text>
          : patients.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.patientCard}
                onPress={() => navigation.navigate('IntakeScreen')}
                activeOpacity={0.8}>
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>{getInitials(p.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientSub}>
                    {p.age} yrs · {p.gestational_age} wks
                  </Text>
                </View>
                {p.risk_tier && (
                  <RiskBadge
                    tier={getTier(p.risk_tier)}
                    label={getBadgeLabel(p.risk_tier)}
                  />
                )}
              </TouchableOpacity>
            ))}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('IntakeScreen')}
          activeOpacity={0.85}>
          <Text style={styles.fabText}>+ New patient screening</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' },
  headerSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.greenLight, fontSize: FontSize.base, fontWeight: '500' },
  body: { flex: 1, padding: Spacing.lg },
  statsGrid: { marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row' },
  sectionLabel: {
    color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  patientCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  initials: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0F6E56', alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { color: '#9FE1CB', fontSize: FontSize.base, fontWeight: '500' },
  patientName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  patientSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.base, textAlign: 'center', marginVertical: Spacing.xl },
  fab: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg,
  },
  fabText: { color: Colors.greenLight, fontSize: FontSize.md, fontWeight: '500' },
});

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { AnomalyBar, AppButton } from '../components';
import { insertRiskScore, insertReferral } from '../db/database';
import { PredictionResult } from '../ml/inference';

export default function ResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { result, visitId, patientId, patientName } = route.params as {
    result: PredictionResult; visitId: number; patientId: number; patientName: string;
  };

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const tierConfig = {
    high:     { color: Colors.red,   bg: Colors.redBg,   label: 'High anomaly risk',  action: 'Refer immediately', icon: '⚠️' },
    elevated: { color: Colors.amber, bg: Colors.amberBg, label: 'Elevated risk',       action: 'Monitor closely',   icon: '⚡' },
    low:      { color: '#4ADE80',    bg: '#14532D',      label: 'Low risk',            action: 'Routine care',      icon: '✓' },
  }[result.risk_tier];

  const actionText = {
    high:     'Refer patient to district hospital for ultrasound confirmation within 48 hours. Do not delay.',
    elevated: 'Schedule follow-up visit within 2 weeks. Monitor blood pressure and fetal movement.',
    low:      'Continue standard antenatal care. Next scheduled visit in 4 weeks.',
  }[result.risk_tier];

  const actionTextRW = {
    high:     'Ohereza umubyeyi kwa muganga w\'akarere ku isuzumwa ry\'echographie mu masaha 48. Ntutinde.',
    elevated: 'Tegura gusura mu by\'iminsi 14. Kurikirana umuvuduko w\'amaraso no kugenda kw\'umwana.',
    low:      'Komeza kujya ku muganga bisanzwe. Gusura gukomeza mu by\'iminsi 28.',
  }[result.risk_tier];

  const handleSave = async () => {
    if (saved) return;
    setSaving(true);
    try {
      await insertRiskScore(visitId, result);
      setSaved(true);
      Alert.alert('Saved', 'Record saved to offline storage.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleReferral = async () => {
    try {
      const scoreId = await insertRiskScore(visitId, result);
      await insertReferral(patientId, Number(scoreId), '');
      Alert.alert('Referral queued', 'Will be sent to DHIS2 when connectivity is available.');
      setSaved(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to queue referral.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('DashboardScreen')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{patientName} · Result</Text>
        <View />
      </View>

      <ScrollView style={styles.body}>
        {/* Risk Card */}
        <View style={[styles.riskCard, { backgroundColor: tierConfig.bg, borderColor: tierConfig.color }]}>
          <Text style={styles.riskIcon}>{tierConfig.icon}</Text>
          <Text style={[styles.riskLabel, { color: tierConfig.color }]}>PREDICTION RESULT</Text>
          <Text style={[styles.riskTitle, { color: Colors.text }]}>{tierConfig.label}</Text>
          <Text style={[styles.riskScore, { color: tierConfig.color }]}>
            Overall risk score: {result.overall_score} · {tierConfig.action}
          </Text>
        </View>

        {/* Anomaly Breakdown */}
        <Text style={styles.sectionLabel}>ANOMALY PROBABILITY BREAKDOWN</Text>
        <View style={styles.card}>
          <AnomalyBar label="Congenital heart disease" prob={result.chd_prob} />
          <AnomalyBar label="Neural tube defect"       prob={result.ntd_prob} />
          <AnomalyBar label="Renal anomaly"            prob={result.renal_prob} />
          <AnomalyBar label="Abdominal wall defect"    prob={result.abdominal_prob} />
          <AnomalyBar label="Cleft lip / palate"       prob={result.cleft_prob} />
        </View>

        {/* Bilingual Action Card */}
        <View style={[styles.actionCard, { borderColor: tierConfig.color }]}>
          <Text style={[styles.actionTitle, { color: tierConfig.color }]}>RECOMMENDED ACTION</Text>
          <Text style={styles.actionText}>{actionText}</Text>
          <View style={styles.divider} />
          <Text style={[styles.actionTextRW, { color: tierConfig.color }]}>{actionTextRW}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btnHalf, { backgroundColor: tierConfig.color }]}
            onPress={handleReferral} activeOpacity={0.8}>
            <Text style={styles.btnHalfText}>Send referral</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnHalf, styles.btnSecondary]}
            onPress={handleSave} activeOpacity={0.8}>
            <Text style={[styles.btnHalfText, { color: Colors.text }]}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save record'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  backBtn: { color: Colors.green, fontSize: 20 },
  headerTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500', flex: 1, textAlign: 'center' },
  body: { flex: 1, padding: Spacing.lg },
  riskCard: {
    borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 2,
  },
  riskIcon: { fontSize: 32, marginBottom: Spacing.sm },
  riskLabel: { fontSize: FontSize.sm, fontWeight: '500', letterSpacing: 1, marginBottom: 4 },
  riskTitle: { fontSize: FontSize.xl, fontWeight: '500', marginBottom: 6 },
  riskScore: { fontSize: FontSize.base },
  sectionLabel: {
    color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  actionCard: {
    backgroundColor: '#14532D', borderRadius: Radius.md,
    padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5,
  },
  actionTitle: { fontSize: FontSize.sm, fontWeight: '500', letterSpacing: 0.8, marginBottom: 6 },
  actionText: { color: '#DCFCE7', fontSize: FontSize.base, lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#1D9E7550', marginVertical: Spacing.sm },
  actionTextRW: { fontSize: FontSize.sm, fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  btnHalf: {
    flex: 1, padding: Spacing.lg, borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  btnHalfText: { color: Colors.text, fontSize: FontSize.base, fontWeight: '500' },
});

import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Switch, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../theme';

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; valueColor?: string; }
export const StatCard = ({ label, value, valueColor }: StatCardProps) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>
      {value}
    </Text>
  </View>
);

// ─── RiskBadge ───────────────────────────────────────────────────────────────
interface RiskBadgeProps { tier: 'high' | 'elevated' | 'low'; label: string; }
export const RiskBadge = ({ tier, label }: RiskBadgeProps) => {
  const colors = {
    high:     { bg: Colors.redBg,   text: Colors.redText },
    elevated: { bg: Colors.amberBg, text: Colors.amberText },
    low:      { bg: '#14532D',      text: '#86EFAC' },
  }[tier];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

// ─── AppButton ───────────────────────────────────────────────────────────────
interface AppButtonProps {
  label: string; onPress: () => void;
  variant?: 'primary' | 'secondary'; loading?: boolean;
}
export const AppButton = ({ label, onPress, variant = 'primary', loading }: AppButtonProps) => (
  <TouchableOpacity
    style={[styles.btn, variant === 'secondary' && styles.btnSecondary]}
    onPress={onPress} activeOpacity={0.8}>
    {loading
      ? <ActivityIndicator color={variant === 'primary' ? Colors.greenLight : Colors.text} />
      : <Text style={[styles.btnText, variant === 'secondary' && styles.btnTextSecondary]}>
          {label}
        </Text>}
  </TouchableOpacity>
);

// ─── FormField ───────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'numeric' | 'default';
  placeholder?: string;
}
export const FormField = ({ label, value, onChangeText, keyboardType = 'numeric', placeholder }: FormFieldProps) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder ?? ''}
      placeholderTextColor={Colors.textMuted}
    />
  </View>
);

// ─── ToggleRow ───────────────────────────────────────────────────────────────
interface ToggleRowProps { label: string; value: boolean; onValueChange: (v: boolean) => void; }
export const ToggleRow = ({ label, value, onValueChange }: ToggleRowProps) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border, true: Colors.green }}
      thumbColor={Colors.white}
    />
  </View>
);

// ─── SectionHeader ───────────────────────────────────────────────────────────
export const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

// ─── AnomalyBar ──────────────────────────────────────────────────────────────
interface AnomalyBarProps { label: string; prob: number; }
export const AnomalyBar = ({ label, prob }: AnomalyBarProps) => {
  const pct = Math.round(prob * 100);
  const color = pct >= 65 ? Colors.red : pct >= 40 ? Colors.amber : Colors.green;
  return (
    <View style={styles.anomalyRow}>
      <Text style={styles.anomalyLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.anomalyPct, { color }]}>{pct}%</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  statCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, flex: 1,
  },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 4 },
  statValue: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: FontSize.sm, fontWeight: '500' },
  btn: {
    backgroundColor: Colors.green, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnText: { color: Colors.greenLight, fontSize: FontSize.md, fontWeight: '500' },
  btnTextSecondary: { color: Colors.text },
  fieldWrap: { marginBottom: Spacing.md },
  fieldLabel: { color: Colors.textSub, fontSize: FontSize.sm, marginBottom: 5 },
  fieldInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, color: Colors.text,
    fontSize: FontSize.md,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  toggleLabel: { color: Colors.textSub, fontSize: FontSize.base },
  sectionHeader: {
    color: Colors.green, fontSize: FontSize.sm, fontWeight: '500',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: Spacing.sm, marginTop: Spacing.xs,
  },
  anomalyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  anomalyLabel: { color: Colors.textSub, fontSize: FontSize.base, width: 150 },
  barTrack: {
    flex: 1, height: 7, backgroundColor: Colors.border,
    borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: 7, borderRadius: 4 },
  anomalyPct: { fontSize: FontSize.base, width: 36, textAlign: 'right' },
});

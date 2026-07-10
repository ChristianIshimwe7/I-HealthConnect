import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { FormField, ToggleRow, SectionHeader, AppButton } from '../components';
import { insertPatient, insertVisit } from '../db/database';
import { runSimulatedInference, ClinicalInput } from '../ml/inference';

type FolicAcid = 'none' | 'first' | 'ongoing';

export default function IntakeScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Maternal profile
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gravida, setGravida] = useState('');
  const [parity, setParity] = useState('');
  const [gestAge, setGestAge] = useState('');

  // Step 2 — Clinical measurements
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [fundal, setFundal] = useState('');
  const [glucose, setGlucose] = useState('');
  const [hemoglobin, setHemoglobin] = useState('');
  const [weight, setWeight] = useState('');

  // Step 3 — Risk history
  const [familyHistory, setFamilyHistory] = useState(false);
  const [priorLoss, setPriorLoss] = useState(false);
  const [infection, setInfection] = useState(false);
  const [folicAcid, setFolicAcid] = useState<FolicAcid>('none');

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Required', 'Please enter patient name'); return false; }
      if (!age || +age < 10 || +age > 60) { Alert.alert('Invalid', 'Enter valid age (10–60)'); return false; }
      if (!gravida || +gravida < 1) { Alert.alert('Invalid', 'Enter gravida'); return false; }
      if (!gestAge || +gestAge < 4 || +gestAge > 42) { Alert.alert('Invalid', 'Enter gestational age (4–42 wks)'); return false; }
    }
    if (step === 2) {
      if (!systolic || +systolic < 60 || +systolic > 220) { Alert.alert('Invalid', 'Enter valid systolic BP'); return false; }
      if (!diastolic || +diastolic < 40 || +diastolic > 140) { Alert.alert('Invalid', 'Enter valid diastolic BP'); return false; }
      if (!fundal || +fundal < 5 || +fundal > 45) { Alert.alert('Invalid', 'Enter valid fundal height'); return false; }
      if (!glucose || +glucose < 40 || +glucose > 400) { Alert.alert('Invalid', 'Enter valid glucose'); return false; }
      if (!hemoglobin || +hemoglobin < 4 || +hemoglobin > 20) { Alert.alert('Invalid', 'Enter valid hemoglobin'); return false; }
      if (!weight || +weight < 30 || +weight > 200) { Alert.alert('Invalid', 'Enter valid weight'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) setStep(s => s + 1);
  };

  const handlePredict = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const patientId = await insertPatient({
        name: name.trim(), age: +age,
        gravida: +gravida, parity: +parity || 0,
        gestational_age: +gestAge,
      });

      const visitData = {
        systolic_bp: +systolic, diastolic_bp: +diastolic,
        fundal_height: +fundal, glucose: +glucose,
        hemoglobin: +hemoglobin, weight: +weight,
        family_history: familyHistory, prior_loss: priorLoss,
        infection, folic_acid: folicAcid,
      };

      const visitId = await insertVisit(patientId, visitData);

      const input: ClinicalInput = {
        age: +age, gravida: +gravida, parity: +parity || 0,
        gestational_age: +gestAge, ...visitData,
      };

      // Use runInference(input) when your model is ready
      const result = runSimulatedInference(input);

      navigation.navigate('ResultScreen', {
        result, visitId, patientId, patientName: name.trim(),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to run prediction. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = `${(step / 3) * 100}%`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s-1) : navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient intake</Text>
        <Text style={styles.stepLabel}>Step {step} of 3</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth as any }]} />
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Maternal profile ── */}
        {step === 1 && (
          <>
            <SectionHeader label="Maternal profile" />
            <FormField label="Full name" value={name} onChangeText={setName} keyboardType="default" placeholder="e.g. Amina Mukamana" />
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField label="Age (years)" value={age} onChangeText={setAge} />
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={styles.halfField}>
                <FormField label="Gravida" value={gravida} onChangeText={setGravida} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField label="Gestational age (wks)" value={gestAge} onChangeText={setGestAge} />
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={styles.halfField}>
                <FormField label="Parity" value={parity} onChangeText={setParity} />
              </View>
            </View>
          </>
        )}

        {/* ── STEP 2: Clinical measurements ── */}
        {step === 2 && (
          <>
            <SectionHeader label="Clinical measurements" />
            <View style={styles.row}>
              <View style={styles.halfField}><FormField label="Systolic BP (mmHg)" value={systolic} onChangeText={setSystolic} /></View>
              <View style={{ width: Spacing.sm }} />
              <View style={styles.halfField}><FormField label="Diastolic BP (mmHg)" value={diastolic} onChangeText={setDiastolic} /></View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}><FormField label="Fundal height (cm)" value={fundal} onChangeText={setFundal} /></View>
              <View style={{ width: Spacing.sm }} />
              <View style={styles.halfField}><FormField label="Blood glucose (mg/dL)" value={glucose} onChangeText={setGlucose} /></View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}><FormField label="Hemoglobin (g/dL)" value={hemoglobin} onChangeText={setHemoglobin} /></View>
              <View style={{ width: Spacing.sm }} />
              <View style={styles.halfField}><FormField label="Weight (kg)" value={weight} onChangeText={setWeight} /></View>
            </View>
          </>
        )}

        {/* ── STEP 3: Risk history ── */}
        {step === 3 && (
          <>
            <SectionHeader label="Risk history" />
            <ToggleRow label="Family history of anomalies" value={familyHistory} onValueChange={setFamilyHistory} />
            <ToggleRow label="Previous pregnancy loss" value={priorLoss} onValueChange={setPriorLoss} />
            <ToggleRow label="Current infection / fever" value={infection} onValueChange={setInfection} />

            <SectionHeader label="Folic acid supplementation" />
            <View style={styles.chipRow}>
              {(['none','first','ongoing'] as FolicAcid[]).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, folicAcid === opt && styles.chipSelected]}
                  onPress={() => setFolicAcid(opt)}>
                  <Text style={[styles.chipText, folicAcid === opt && styles.chipTextSelected]}>
                    {opt === 'none' ? 'None' : opt === 'first' ? 'First trimester' : 'Ongoing'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {step < 3
            ? <AppButton label="Next →" onPress={handleNext} />
            : <AppButton label="Run anomaly prediction" onPress={handlePredict} loading={loading} />}
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
  headerTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' },
  stepLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  progressTrack: { height: 3, backgroundColor: Colors.surface },
  progressFill: { height: 3, backgroundColor: Colors.green },
  body: { flex: 1, padding: Spacing.lg },
  row: { flexDirection: 'row' },
  halfField: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: '#0F6E56', borderColor: Colors.green },
  chipText: { color: Colors.textMuted, fontSize: FontSize.base },
  chipTextSelected: { color: '#9FE1CB' },
  btnRow: { marginTop: Spacing.xl },
});

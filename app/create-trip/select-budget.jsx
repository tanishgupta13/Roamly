import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState, useContext, useRef } from 'react';
import { CreateTripContext } from '../../context/CreateTripContext';
import { selectBudgetOption } from '../../constants/data';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
  primary:  '#1A6B5A',
  accent:   '#F5A623',
  dark:     '#0D1F1B',
  card:     '#FFFFFF',
  bg:       '#F0F5F3',
  textMain: '#0D1F1B',
  textSub:  '#6B8A82',
  border:   '#D9E8E3',
};

// Budget tier → colour accent so each card feels distinct
const BUDGET_COLORS = {
  Cheap:    { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', tag: '#DCFCE7' },
  Moderate: { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', tag: '#DBEAFE' },
  Luxury:   { bg: '#FDF4FF', border: '#D8B4FE', icon: '#9333EA', tag: '#F3E8FF' },
};
const getBudgetColor = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('cheap') || t.includes('budget') || t.includes('low'))  return BUDGET_COLORS.Cheap;
  if (t.includes('luxury') || t.includes('premium') || t.includes('high')) return BUDGET_COLORS.Luxury;
  return BUDGET_COLORS.Moderate;
};

const STEPS = ['Destination', 'Travelers', 'Dates', 'Budget'];

export default function SelectBudget() {
  const navigation = useNavigation();
  const router     = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);

  const [selectedOption, setSelectedOption] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
    // Pre-fill if coming back
    if (tripData?.budget && !selectedOption) {
      const match = (selectBudgetOption || []).find(o => o.title === tripData.budget);
      if (match) setSelectedOption(match);
    }
  }, []);

  const handleSelect = (item) => {
    setSelectedOption(item);
    setTripData(prev => ({ ...prev, budget: item.title }));
  };

  const handleContinue = () => {
    if (selectedOption) router.push('/create-trip/review-trip');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero ── */}
      <LinearGradient
        colors={[C.dark, C.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Step progress */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepWrap}>
              <View style={[styles.stepDot, i <= 3 && styles.stepDotActive]}>
                {i < 3
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Text style={styles.stepDotText}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < 3 && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.stepLabels}>
          {STEPS.map((step, i) => (
            <Text key={step} style={[styles.stepLabel, i === 3 && styles.stepLabelActive]}>
              {step}
            </Text>
          ))}
        </View>

        <Text style={styles.heroEyebrow}>Step 4 of 4</Text>
        <Text style={styles.heroTitle}>Set Your Budget 💰</Text>
        <Text style={styles.heroSub}>Choose how you'd like to spend on this trip</Text>
      </LinearGradient>

      {/* ── Budget cards ── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {(selectBudgetOption || []).map((item) => {
            const selected = selectedOption?.id === item.id;
            const col      = getBudgetColor(item.title);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  selected && { borderColor: col.border, backgroundColor: col.bg },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.82}
              >
                {/* Left — emoji/icon */}
                <View style={[styles.iconWrap, { backgroundColor: selected ? col.tag : C.bg }]}>
                  <Text style={styles.iconEmoji}>{item.icon}</Text>
                </View>

                {/* Middle — title + desc */}
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, selected && { color: col.icon }]}>
                    {item.title}
                  </Text>
                  {item.desc ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
                  ) : null}
                  {/* Cost range pill */}
                  {item.people || item.cost ? (
                    <View style={[styles.rangePill, { backgroundColor: selected ? col.tag : C.border }]}>
                      <Ionicons name="wallet-outline" size={11} color={selected ? col.icon : C.textSub} />
                      <Text style={[styles.rangeText, selected && { color: col.icon }]}>
                        {item.people || item.cost}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Right — radio */}
                <View style={[styles.radioOuter, selected && { borderColor: col.icon }]}>
                  {selected && <View style={[styles.radioInner, { backgroundColor: col.icon }]} />}
                </View>

                {/* Accent stripe */}
                {selected && (
                  <View style={[styles.selectedStripe, { backgroundColor: col.icon }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {selectedOption ? (
            <View style={styles.selectionHint}>
              <Text style={styles.selectionHintEmoji}>{selectedOption.icon}</Text>
              <Text style={styles.selectionHintText}>{selectedOption.title} budget selected</Text>
            </View>
          ) : (
            <Text style={styles.selectionNone}>Select a budget to continue</Text>
          )}

          <TouchableOpacity
            style={[styles.continueBtn, !selectedOption && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedOption}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Review Trip</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: {
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },

  stepsRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stepWrap:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive:  { backgroundColor: C.accent },
  stepDotText:    { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff' },
  stepLine:       { width: (width - 40 - 22 * 4) / 3, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 2 },
  stepLineActive: { backgroundColor: C.accent },
  stepLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  stepLabel:      { fontFamily: 'poppins', fontSize: 9, color: 'rgba(255,255,255,0.5)', flex: 1, textAlign: 'center' },
  stepLabelActive:{ color: C.accent, fontFamily: 'poppins-semi' },

  heroEyebrow: { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  heroTitle:   { fontFamily: 'poppins-semi', fontSize: 26, color: '#fff', marginBottom: 4 },
  heroSub:     { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  listContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 18,
    padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  selectedStripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
  },

  iconWrap: {
    width: 54, height: 54, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  iconEmoji: { fontSize: 28 },

  cardText:  { flex: 1 },
  cardTitle: { fontFamily: 'poppins-semi', fontSize: 15, color: C.textMain, marginBottom: 2 },
  cardDesc:  { fontFamily: 'poppins', fontSize: 12, color: C.textSub, lineHeight: 17 },

  rangePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  rangeText: { fontFamily: 'poppins', fontSize: 10, color: C.textSub },

  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  footer: {
    paddingHorizontal: 18, paddingBottom: 34, paddingTop: 10,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 10,
  },
  selectionHint:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectionHintEmoji: { fontSize: 18 },
  selectionHintText:  { fontFamily: 'poppins-semi', fontSize: 13, color: C.primary },
  selectionNone:      { fontFamily: 'poppins', fontSize: 13, color: C.textSub, textAlign: 'center' },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { fontFamily: 'poppins-semi', fontSize: 16, color: '#fff' },
});
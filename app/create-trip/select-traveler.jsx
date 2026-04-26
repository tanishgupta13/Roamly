import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Animated, Dimensions,
} from 'react-native';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { CreateTripContext } from '@/context/CreateTripContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { selectTravelersList } from '@/constants/data';

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

export default function SelectTraveler() {
  const navigation = useNavigation();
  const router     = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);

  const [selectedTraveler, setSelectedTraveler] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pre-select if coming back
  useEffect(() => {
    if (tripData?.traveler && !selectedTraveler) {
      setSelectedTraveler(tripData.traveler);
    }
  }, []);

  // ── KEY FIX: guard — if no locationInfo, go back to search ───────────────
  useEffect(() => {
    if (!tripData?.locationInfo) {
      console.warn('No locationInfo found, redirecting to search');
      router.replace('/create-trip/search-place');
    }
  }, []);

  const handleSelect = (item) => {
    setSelectedTraveler(item);
    setTripData(prev => ({ ...(prev || {}), traveler: item }));
  };

  const handleContinue = () => {
    if (selectedTraveler) router.push('/create-trip/dateSelection');
  };

  const STEPS = ['Destination', 'Travelers', 'Dates', 'Budget'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.dark, C.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepWrap}>
              <View style={[styles.stepDot, i <= 1 && styles.stepDotActive]}>
                {i < 1
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Text style={styles.stepDotText}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < 1 && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.stepLabels}>
          {STEPS.map((step, i) => (
            <Text key={step} style={[styles.stepLabel, i === 1 && styles.stepLabelActive]}>
              {step}
            </Text>
          ))}
        </View>

        <Text style={styles.heroEyebrow}>Step 2 of 4</Text>
        <Text style={styles.heroTitle}>Who's Traveling?</Text>
        <Text style={styles.heroSub}>
          {tripData?.locationInfo?.name ? `Planning your trip to ${tripData.locationInfo.name.split(',')[0]}` : 'Select your group type to tailor your trip'}
        </Text>
      </LinearGradient>

      <Animated.View style={[{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {selectTravelersList.map((item) => {
            const selected = selectedTraveler?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.82}
              >
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  <Text style={styles.iconEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                    {item.title}
                  </Text>
                  {item.desc ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
                  ) : null}
                  {item.people ? (
                    <View style={styles.peoplePill}>
                      <Ionicons name="people-outline" size={11} color={C.textSub} />
                      <Text style={styles.peopleText}>{item.people}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                {selected && <View style={styles.selectedStripe} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          {selectedTraveler ? (
            <View style={styles.selectionHint}>
              <Text style={styles.selectionHintEmoji}>{selectedTraveler.icon}</Text>
              <Text style={styles.selectionHintText}>{selectedTraveler.title} selected</Text>
            </View>
          ) : (
            <Text style={styles.selectionNone}>Select a group type to continue</Text>
          )}
          <TouchableOpacity
            style={[styles.continueBtn, !selectedTraveler && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedTraveler}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
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
  heroEyebrow:    { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  heroTitle:      { fontFamily: 'poppins-semi', fontSize: 26, color: '#fff', marginBottom: 4 },
  heroSub:        { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  listContent:    { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  cardSelected:       { borderColor: C.primary, backgroundColor: '#F0F9F5' },
  selectedStripe:     { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.primary, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  iconWrap:           { width: 52, height: 52, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  iconWrapSelected:   { backgroundColor: C.primary + '18' },
  iconEmoji:          { fontSize: 26 },
  cardText:           { flex: 1 },
  cardTitle:          { fontFamily: 'poppins-semi', fontSize: 15, color: C.textMain, marginBottom: 2 },
  cardTitleSelected:  { color: C.primary },
  cardDesc:           { fontFamily: 'poppins', fontSize: 12, color: C.textSub, lineHeight: 17 },
  peoplePill:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, alignSelf: 'flex-start', backgroundColor: C.border, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  peopleText:         { fontFamily: 'poppins', fontSize: 10, color: C.textSub },
  radioOuter:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: C.primary },
  radioInner:         { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  footer:             { paddingHorizontal: 18, paddingBottom: 34, paddingTop: 10, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  selectionHint:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectionHintEmoji: { fontSize: 18 },
  selectionHintText:  { fontFamily: 'poppins-semi', fontSize: 13, color: C.primary },
  selectionNone:      { fontFamily: 'poppins', fontSize: 13, color: C.textSub, textAlign: 'center' },
  continueBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15 },
  continueBtnDisabled:{ opacity: 0.45 },
  continueBtnText:    { fontFamily: 'poppins-semi', fontSize: 16, color: '#fff' },
});
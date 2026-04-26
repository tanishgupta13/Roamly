import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, StatusBar, Animated,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useContext, useRef } from 'react';
import moment from 'moment';
import { CreateTripContext } from '../../context/CreateTripContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

// Each review row gets its own colour accent
const ROW_THEMES = [
  { icon: 'location',         color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { icon: 'calendar',         color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { icon: 'people',           color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: 'wallet',           color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
];

const STEPS = ['Destination', 'Travelers', 'Dates', 'Budget'];

// Animated review row card
const ReviewCard = ({ theme, label, value, emoji, delay }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.reviewCard, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        {/* Left accent strip */}
        <View style={[styles.reviewStripe, { backgroundColor: theme.color }]} />

        {/* Icon */}
        <View style={[styles.reviewIconWrap, { backgroundColor: theme.color + '18' }]}>
          {emoji
            ? <Text style={{ fontSize: 22 }}>{emoji}</Text>
            : <Ionicons name={`${theme.icon}-outline`} size={20} color={theme.color} />
          }
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewLabel}>{label}</Text>
          <Text style={styles.reviewValue} numberOfLines={3}>{value}</Text>
        </View>

        {/* Tick */}
        <View style={[styles.reviewTick, { backgroundColor: theme.color + '18' }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.color} />
        </View>
      </View>
    </Animated.View>
  );
};

export default function ReviewTrip() {
  const navigation = useNavigation();
  const router     = useRouter();
  const { tripData } = useContext(CreateTripContext);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  const destination = tripData?.locationInfo?.name || '—';
  const dateStr     = tripData?.startDate && tripData?.endDate
    ? `${moment(tripData.startDate).format('DD MMM')} → ${moment(tripData.endDate).format('DD MMM YYYY')} · ${tripData.totalNumOfDays} Days`
    : '—';
  const traveler    = tripData?.traveler?.title || '—';
  const travelerEmoji = tripData?.traveler?.icon || null;
  const budget      = tripData?.budget || '—';

  const rows = [
    { label: 'Destination',     value: destination,    emoji: '📍',           theme: ROW_THEMES[0] },
    { label: 'Travel Dates',    value: dateStr,         emoji: '📅',           theme: ROW_THEMES[1] },
    { label: 'Who\'s Going',    value: traveler,        emoji: travelerEmoji,  theme: ROW_THEMES[2] },
    { label: 'Budget Level',    value: budget,          emoji: '💰',           theme: ROW_THEMES[3] },
  ];

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

        {/* Step indicator — all complete */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepWrap}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, styles.stepLineActive]} />}
            </View>
          ))}
        </View>
        <View style={styles.stepLabels}>
          {STEPS.map(step => (
            <Text key={step} style={styles.stepLabelDone}>{step}</Text>
          ))}
        </View>

        <View style={styles.heroTextRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>All set! ✨</Text>
            <Text style={styles.heroTitle}>Review Your Trip</Text>
            <Text style={styles.heroSub}>Check everything before we build your plan</Text>
          </View>
          {/* Destination bubble */}
          <View style={styles.destBubble}>
            <Text style={styles.destBubbleEmoji}>✈️</Text>
            <Text style={styles.destBubbleText} numberOfLines={2}>{destination}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Review cards ── */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Summary banner */}
        <View style={styles.summaryBanner}>
          <Ionicons name="sparkles-outline" size={16} color={C.primary} />
          <Text style={styles.summaryBannerText}>
            Everything looks good! Your AI trip plan is ready to be generated.
          </Text>
        </View>

        {rows.map((row, i) => (
          <ReviewCard
            key={i}
            theme={row.theme}
            label={row.label}
            value={row.value}
            emoji={row.emoji}
            delay={i * 80}
          />
        ))}

        {/* Trip summary chip */}
        <View style={styles.tripSummaryRow}>
          {[
            { icon: 'time-outline',   val: `${tripData?.totalNumOfDays || '—'} Days` },
            { icon: 'people-outline', val: traveler },
            { icon: 'wallet-outline', val: budget },
          ].map((chip, i) => (
            <View key={i} style={styles.tripChip}>
              <Ionicons name={chip.icon} size={13} color={C.primary} />
              <Text style={styles.tripChipText}>{chip.val}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </Animated.ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <LinearGradient
          colors={[C.primary, '#2D9B7B']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.buildBtnGradient}
        >
          <TouchableOpacity
            style={styles.buildBtn}
            onPress={() => router.replace('/create-trip/generate-trip')}
            activeOpacity={0.88}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.buildBtnText}>Build My Trip with AI</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <Text style={styles.footerHint}>
          Powered by Gemini AI · Takes about 15 seconds
        </Text>
      </View>
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
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },

  stepsRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stepWrap:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive:  { backgroundColor: C.accent },
  stepLine:       { width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 2 },
  stepLineActive: { backgroundColor: C.accent },
  stepLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stepLabelDone:  { fontFamily: 'poppins-semi', fontSize: 9, color: C.accent, flex: 1, textAlign: 'center' },

  heroTextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroEyebrow: { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  heroTitle:   { fontFamily: 'poppins-semi', fontSize: 24, color: '#fff', marginBottom: 3 },
  heroSub:     { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  destBubble: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 12, alignItems: 'center',
    maxWidth: 96, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  destBubbleEmoji: { fontSize: 24, marginBottom: 4 },
  destBubbleText:  { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff', textAlign: 'center' },

  listContent: { paddingHorizontal: 18, paddingTop: 16 },

  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary + '12', borderRadius: 12,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: C.primary + '25',
  },
  summaryBannerText: { fontFamily: 'poppins', fontSize: 12, color: C.primary, flex: 1, lineHeight: 17 },

  reviewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  reviewStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  reviewIconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  reviewLabel: { fontFamily: 'poppins', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  reviewValue: { fontFamily: 'poppins-semi', fontSize: 14, color: C.textMain, lineHeight: 20 },
  reviewTick:  { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  tripSummaryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  tripChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  tripChipText: { fontFamily: 'poppins-semi', fontSize: 12, color: C.primary },

  footer: {
    paddingHorizontal: 18, paddingBottom: 34, paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 8,
  },
  buildBtnGradient: { borderRadius: 16, overflow: 'hidden' },
  buildBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
  },
  buildBtnText: { fontFamily: 'poppins-semi', fontSize: 17, color: '#fff' },
  footerHint: { fontFamily: 'poppins', fontSize: 11, color: C.textSub, textAlign: 'center' },
});
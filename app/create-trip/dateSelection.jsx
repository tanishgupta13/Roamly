import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState, useContext, useRef } from 'react';
import moment from 'moment';
import { CreateTripContext } from '../../context/CreateTripContext';
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
  danger:   '#E03434',
};

const MAX_TRIP_DAYS = 5;
const STEPS = ['Destination', 'Travelers', 'Dates', 'Budget'];

// Returns an array of dates between start and end (inclusive)
const getDatesInRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Mini calendar strip — shows 14 days from today, lets user tap start/end
const CalendarStrip = ({ startDate, endDate, onSelectDate, today }) => {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <View style={styles.stripWrap}>
      {days.map((d, i) => {
        const isStart    = moment(d).isSame(startDate, 'day');
        const isEnd      = moment(d).isSame(endDate, 'day');
        const inRange    = moment(d).isBetween(startDate, endDate, 'day', '[]');
        const isPast     = d < today;
        const isSelected = isStart || isEnd;

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.stripDay,
              inRange    && styles.stripDayRange,
              isSelected && styles.stripDaySelected,
              isPast     && styles.stripDayPast,
            ]}
            onPress={() => !isPast && onSelectDate(d)}
            disabled={isPast}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.stripDayName,
              isSelected && styles.stripDayTextSelected,
              inRange && !isSelected && styles.stripDayTextRange,
            ]}>
              {moment(d).format('ddd')}
            </Text>
            <Text style={[
              styles.stripDayNum,
              isSelected && styles.stripDayTextSelected,
              inRange && !isSelected && styles.stripDayTextRange,
            ]}>
              {moment(d).format('D')}
            </Text>
            {isStart && <View style={styles.stripStartDot} />}
            {isEnd   && <View style={styles.stripEndDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function SelectDate() {
  const navigation = useNavigation();
  const router     = useRouter();
  const { tripData, setTripData } = useContext(CreateTripContext);

  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [showStart, setShowStart] = useState(false);
  const [showEnd,   setShowEnd]   = useState(false);
  // 'start' | 'end' — which picker to open on strip tap
  const [pickingMode, setPickingMode] = useState('start');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    // Pre-fill from context if coming back
    if (tripData?.startDate) setStartDate(new Date(tripData.startDate));
    if (tripData?.endDate)   setEndDate(new Date(tripData.endDate));
  }, []);

  const endDateLimit = new Date(startDate);
  endDateLimit.setDate(startDate.getDate() + MAX_TRIP_DAYS - 1);

  const tripDays   = moment(endDate).diff(moment(startDate), 'days') + 1;
  const isValid    = endDate >= startDate && tripDays >= 1;

  const onStartChange = (event, selectedDate) => {
    setShowStart(false);
    if (!selectedDate) return;
    setStartDate(selectedDate);
    // If end is before new start, reset end to start
    if (endDate < selectedDate) setEndDate(selectedDate);
  };

  const onEndChange = (event, selectedDate) => {
    setShowEnd(false);
    if (!selectedDate) return;
    setEndDate(selectedDate);
  };

  // Strip tap — first tap sets start, second sets end
  const handleStripTap = (d) => {
    if (pickingMode === 'start') {
      setStartDate(d);
      setEndDate(d);
      setPickingMode('end');
    } else {
      if (d < startDate) {
        setStartDate(d);
        setEndDate(d);
        setPickingMode('end');
      } else {
        const limit = new Date(startDate);
        limit.setDate(startDate.getDate() + MAX_TRIP_DAYS - 1);
        setEndDate(d > limit ? limit : d);
        setPickingMode('start');
      }
    }
  };

  const handleContinue = () => {
    if (!isValid) return;
    setTripData(prev => ({
      ...prev,
      startDate:      moment(startDate),
      endDate:        moment(endDate),
      totalNumOfDays: tripDays,
    }));
    router.push('/create-trip/select-budget');
  };

  // Duration label
  const durationLabel = tripDays === 1
    ? '1 day'
    : `${tripDays} days · ${tripDays - 1} night${tripDays - 1 > 1 ? 's' : ''}`;

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
              <View style={[styles.stepDot, i <= 2 && styles.stepDotActive]}>
                {i < 2
                  ? <Ionicons name="checkmark" size={11} color="#fff" />
                  : <Text style={styles.stepDotText}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < 2 && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.stepLabels}>
          {STEPS.map((step, i) => (
            <Text key={step} style={[styles.stepLabel, i === 2 && styles.stepLabelActive]}>
              {step}
            </Text>
          ))}
        </View>

        <Text style={styles.heroEyebrow}>Step 3 of 4</Text>
        <Text style={styles.heroTitle}>Travel Dates</Text>
        <Text style={styles.heroSub}>
          {pickingMode === 'start'
            ? 'Tap a date to set your departure'
            : 'Now tap your return date'}
        </Text>
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Calendar strip ── */}
        <View style={styles.stripCard}>
          <Text style={styles.stripHint}>
            {pickingMode === 'start' ? '① Pick departure date' : '② Pick return date'}
          </Text>
          <CalendarStrip
            startDate={startDate}
            endDate={endDate}
            onSelectDate={handleStripTap}
            today={today}
          />
        </View>

        {/* ── Date summary cards ── */}
        <View style={styles.summaryRow}>
          {/* Start date */}
          <TouchableOpacity
            style={[styles.summaryCard, pickingMode === 'start' && styles.summaryCardActive]}
            onPress={() => { setPickingMode('start'); setShowStart(true); }}
            activeOpacity={0.82}
          >
            <View style={styles.summaryIconRow}>
              <Ionicons name="airplane-outline" size={14} color={C.primary} />
              <Text style={styles.summaryCardLabel}>Departure</Text>
            </View>
            <Text style={styles.summaryCardDate}>
              {moment(startDate).format('ddd, DD MMM')}
            </Text>
            <Text style={styles.summaryCardYear}>{moment(startDate).format('YYYY')}</Text>
            {pickingMode === 'start' && <View style={styles.activeUnderline} />}
          </TouchableOpacity>

          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={13} color={C.primary} />
            <Text style={styles.durationText}>{durationLabel}</Text>
          </View>

          {/* End date */}
          <TouchableOpacity
            style={[styles.summaryCard, pickingMode === 'end' && styles.summaryCardActive]}
            onPress={() => { setPickingMode('end'); setShowEnd(true); }}
            activeOpacity={0.82}
          >
            <View style={styles.summaryIconRow}>
              <Ionicons name="home-outline" size={14} color={C.primary} />
              <Text style={styles.summaryCardLabel}>Return</Text>
            </View>
            <Text style={styles.summaryCardDate}>
              {moment(endDate).format('ddd, DD MMM')}
            </Text>
            <Text style={styles.summaryCardYear}>{moment(endDate).format('YYYY')}</Text>
            {pickingMode === 'end' && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Max days notice */}
        <View style={styles.noticeRow}>
          <Ionicons name="information-circle-outline" size={14} color={C.textSub} />
          <Text style={styles.noticeText}>
            Max trip length is {MAX_TRIP_DAYS} days for AI-generated plans
          </Text>
        </View>

        {/* Native pickers — appear on button press */}
        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            onChange={onStartChange}
            minimumDate={today}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={endDate}
            mode="date"
            onChange={onEndChange}
            minimumDate={startDate}
            maximumDate={endDateLimit}
          />
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerSummaryText}>
              {moment(startDate).format('DD MMM')} → {moment(endDate).format('DD MMM YYYY')}
            </Text>
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>{durationLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
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
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 22,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },

  stepsRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stepWrap:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive:  { backgroundColor: C.accent },
  stepDotText:    { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff' },
  stepLine:       { width: (width - 40 - 22 * 4) / 3, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 2 },
  stepLineActive: { backgroundColor: C.accent },
  stepLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stepLabel:      { fontFamily: 'poppins', fontSize: 9, color: 'rgba(255,255,255,0.5)', flex: 1, textAlign: 'center' },
  stepLabelActive:{ color: C.accent, fontFamily: 'poppins-semi' },

  heroEyebrow: { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  heroTitle:   { fontFamily: 'poppins-semi', fontSize: 26, color: '#fff', marginBottom: 4 },
  heroSub:     { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  // Calendar strip
  stripCard: {
    marginHorizontal: 18, marginTop: 16,
    backgroundColor: C.card, borderRadius: 18,
    paddingTop: 14, paddingBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  stripHint: {
    fontFamily: 'poppins-semi', fontSize: 12, color: C.primary,
    paddingHorizontal: 14, marginBottom: 10,
  },
  stripWrap: {
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  stripDay: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, marginHorizontal: 1,
  },
  stripDayRange:    { backgroundColor: C.primary + '15' },
  stripDaySelected: { backgroundColor: C.primary },
  stripDayPast:     { opacity: 0.3 },
  stripStartDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 3 },
  stripEndDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 3 },
  stripDayName:     { fontFamily: 'poppins', fontSize: 9, color: C.textSub },
  stripDayNum:      { fontFamily: 'poppins-semi', fontSize: 13, color: C.textMain, marginTop: 2 },
  stripDayTextSelected: { color: '#fff' },
  stripDayTextRange:    { color: C.primary },

  // Summary cards
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 18, marginTop: 14, gap: 0,
  },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16,
    padding: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  summaryCardActive: { borderColor: C.primary },
  summaryIconRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  summaryCardLabel:  { fontFamily: 'poppins', fontSize: 11, color: C.textSub },
  summaryCardDate:   { fontFamily: 'poppins-semi', fontSize: 15, color: C.textMain },
  summaryCardYear:   { fontFamily: 'poppins', fontSize: 11, color: C.textSub, marginTop: 1 },
  activeUnderline:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: C.primary },

  durationBadge: {
    alignItems: 'center', paddingHorizontal: 8, gap: 3,
  },
  durationText: { fontFamily: 'poppins-semi', fontSize: 10, color: C.primary, textAlign: 'center' },

  // Notice
  noticeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginTop: 12,
  },
  noticeText: { fontFamily: 'poppins', fontSize: 11, color: C.textSub, flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: 18, paddingBottom: 34, paddingTop: 12,
    marginTop: 'auto',
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 12,
  },
  footerSummary:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerSummaryText: { fontFamily: 'poppins-semi', fontSize: 13, color: C.textMain, flex: 1 },
  footerBadge: {
    backgroundColor: C.primary + '18',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  footerBadgeText: { fontFamily: 'poppins-semi', fontSize: 11, color: C.primary },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { fontFamily: 'poppins-semi', fontSize: 16, color: '#fff' },
});
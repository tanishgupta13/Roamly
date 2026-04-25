import {
  StyleSheet, Text, View, ScrollView, Image,
  TouchableOpacity, Linking, SafeAreaView, Animated, Easing,
} from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import moment from 'moment';
import Ionicons from '@expo/vector-icons/Ionicons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely coerce any "duration" value the AI might return into a display string.
 * Handles: string · number · { days, nights } · { days } · { value, unit } etc.
 */
const safeDuration = (raw, itineraryLength) => {
  if (!raw) return `${itineraryLength || 1} Day${itineraryLength > 1 ? 's' : ''}`;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return `${raw} Day${raw !== 1 ? 's' : ''}`;
  if (typeof raw === 'object') {
    const { days, nights, value, unit } = raw;
    if (days && nights) return `${days}D / ${nights}N`;
    if (days)           return `${days} Day${days !== 1 ? 's' : ''}`;
    if (value && unit)  return `${value} ${unit}`;
    const first = Object.entries(raw)[0];
    return first ? `${first[1]} ${first[0]}` : String(itineraryLength ?? 1);
  }
  return String(raw);
};

const TIME_COLORS = {
  morning:   { bg: '#FFFBEB', border: '#F59E0B', icon: '🌅', label: '#92400E', tag: '#FEF3C7' },
  afternoon: { bg: '#FFF1F2', border: '#F43F5E', icon: '☀️', label: '#9F1239', tag: '#FFE4E6' },
  evening:   { bg: '#EEF2FF', border: '#6366F1', icon: '🌆', label: '#3730A3', tag: '#E0E7FF' },
  night:     { bg: '#F5F3FF', border: '#8B5CF6', icon: '🌙', label: '#5B21B6', tag: '#EDE9FE' },
  default:   { bg: '#F0FDF4', border: '#10B981', icon: '📍', label: '#065F46', tag: '#D1FAE5' },
};

const getTimeMeta = (str = '') => {
  const s = str.toLowerCase();
  if (s.includes('morning'))   return TIME_COLORS.morning;
  if (s.includes('afternoon')) return TIME_COLORS.afternoon;
  if (s.includes('evening'))   return TIME_COLORS.evening;
  if (s.includes('night'))     return TIME_COLORS.night;
  return TIME_COLORS.default;
};

const extractLabel = (str = '') => {
  const match = str.match(/\(([^)]+)\)/);
  return match ? match[1] : str;
};

// ─── Parse plain-string activities ───────────────────────────────────────────
const parseStringActivity = (str) => {
  const timeMatch = str.match(/^(Early Morning|Late Morning|Morning|Afternoon|Late Afternoon|Evening|Night)[:\s]/i);
  const timeSlot = timeMatch ? timeMatch[1] : 'Activity';
  const activityText = str.replace(/^(Early Morning|Late Morning|Morning|Afternoon|Late Afternoon|Evening|Night)[:\s]/i, '').trim();

  const priceMatch = activityText.match(
    /(₹[\d,]+(?:\s*-\s*₹?[\d,]+)?(?:\s*per\s*\w+)?|free(?: of charge)?|no entry fee|INR\s*[\d,]+(?:\s*-\s*[\d,]+)?)/i
  );
  const travelMatch = activityText.match(
    /(?:approx\.?\s*)?(\d+(?:\.\d+)?(?:\s*-\s*\d+)?\s*(?:min(?:ute)?s?|hrs?|hours?))(?:\s+(?:by\s+\w+|drive|walk|trek|ride))?/i
  );

  return {
    timeSlot,
    activityText,
    ticket_pricing: priceMatch ? priceMatch[0] : null,
    time_to_travel: travelMatch ? travelMatch[0] : null,
  };
};

// ─── Activity Card ────────────────────────────────────────────────────────────
const ActivityCard = ({ timeSlot, activityText, ticketPricing, travelTime, geoCoordinates, index }) => {
  const meta     = getTimeMeta(timeSlot);
  const label    = extractLabel(timeSlot);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 75, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 75, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, []);

  const openMap = () => {
    if (!geoCoordinates) return;
    const { latitude, longitude } = geoCoordinates;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.activityCard, { borderLeftColor: meta.border, backgroundColor: meta.bg }]}>
        <View style={[styles.timeBadge, { backgroundColor: meta.tag }]}>
          <Text style={styles.timeBadgeIcon}>{meta.icon}</Text>
          <Text style={[styles.timeBadgeLabel, { color: meta.label }]}>{label}</Text>
        </View>

        <Text style={styles.activityText}>{activityText}</Text>

        {(travelTime || ticketPricing) ? (
          <View style={styles.pillRow}>
            {travelTime ? (
              <View style={[styles.pill, { borderColor: meta.border + '55' }]}>
                <Ionicons name="time-outline" size={11} color={meta.label} />
                <Text style={[styles.pillText, { color: meta.label }]}>{travelTime}</Text>
              </View>
            ) : null}
            {ticketPricing ? (
              <View style={[styles.pill, { borderColor: meta.border + '55' }]}>
                <Ionicons name="ticket-outline" size={11} color={meta.label} />
                <Text style={[styles.pillText, { color: meta.label }]}>{ticketPricing}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {geoCoordinates ? (
          <TouchableOpacity style={[styles.mapBtn, { borderColor: meta.border + '66' }]} onPress={openMap}>
            <Ionicons name="navigate-outline" size={12} color={meta.label} />
            <Text style={[styles.mapBtnText, { color: meta.label }]}>Open in Maps</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, color = Colors.PRIMARY }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIconWrap, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
  </View>
);

// ─── Quick Stats Bar ──────────────────────────────────────────────────────────
const QuickStats = ({ totalActivities, totalDays }) => (
  <View style={styles.quickStats}>
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatNum}>{totalDays}</Text>
      <Text style={styles.quickStatLabel}>Days</Text>
    </View>
    <View style={styles.quickStatDivider} />
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatNum}>{totalActivities}</Text>
      <Text style={styles.quickStatLabel}>Activities</Text>
    </View>
    <View style={styles.quickStatDivider} />
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatNum}>✦</Text>
      <Text style={styles.quickStatLabel}>AI Curated</Text>
    </View>
  </View>
);

// ─── Pre-Trip Checklist ───────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { id: 1, text: 'Book flights',           icon: 'airplane-outline' },
  { id: 2, text: 'Reserve hotel',           icon: 'bed-outline' },
  { id: 3, text: 'Travel insurance',        icon: 'shield-checkmark-outline' },
  { id: 4, text: 'Pack essentials',         icon: 'bag-outline' },
  { id: 5, text: 'Download offline maps',   icon: 'map-outline' },
  { id: 6, text: 'Notify your bank',        icon: 'card-outline' },
];

const TripChecklist = () => {
  const [checked, setChecked] = useState({});
  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <View style={styles.bonusCard}>
      <View style={styles.bonusHeader}>
        <Ionicons name="checkbox-outline" size={18} color={Colors.PRIMARY} />
        <Text style={styles.bonusTitle}>Pre-Trip Checklist</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{done}/{CHECKLIST_ITEMS.length}</Text>
        </View>
      </View>
      <View style={styles.checklistBar}>
        <View style={[styles.checklistBarFill, { width: `${(done / CHECKLIST_ITEMS.length) * 100}%` }]} />
      </View>
      {CHECKLIST_ITEMS.map(item => (
        <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggle(item.id)}>
          <View style={[styles.checkCircle, checked[item.id] && styles.checkCircleDone]}>
            {checked[item.id] ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
          </View>
          <Ionicons name={item.icon} size={14} color={checked[item.id] ? '#10B981' : '#9CA3AF'} style={{ marginHorizontal: 9 }} />
          <Text style={[styles.checkText, checked[item.id] && styles.checkTextDone]}>{item.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Travel Links ─────────────────────────────────────────────────────────────
const TravelLinks = ({ destination }) => (
  <View style={styles.bonusCard}>
    <View style={styles.bonusHeader}>
      <Ionicons name="globe-outline" size={18} color="#6366F1" />
      <Text style={styles.bonusTitle}>Helpful Links</Text>
    </View>
    {[
      { icon: 'shield-outline',        color: '#EF4444', label: 'Local emergency numbers',  url: `https://www.google.com/search?q=emergency+numbers+${encodeURIComponent(destination)}` },
      { icon: 'document-text-outline', color: '#F59E0B', label: 'Check visa requirements',  url: 'https://www.iatatravelcentre.com/world.php' },
      { icon: 'star-outline',          color: '#6366F1', label: 'Traveler reviews',          url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination)}` },
      { icon: 'cloud-outline',         color: '#0EA5E9', label: 'Local weather forecast',    url: `https://www.weather.com/weather/tenday/l/${encodeURIComponent(destination)}` },
    ].map((item, i) => (
      <TouchableOpacity key={i} style={styles.linkRow} onPress={() => Linking.openURL(item.url)}>
        <View style={[styles.linkIconWrap, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon} size={15} color={item.color} />
        </View>
        <Text style={styles.linkText}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={13} color="#CBD5E1" />
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlannedTripPage() {
  const { tripData, destination } = useLocalSearchParams();
  const router = useRouter();
  const [expandedDays, setExpandedDays] = useState({});

  let parsedTripData;
  try {
    parsedTripData = JSON.parse(tripData || destination);
  } catch {
    return (
      <SafeAreaView style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.safeBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.errorText}>Error loading trip data.</Text>
      </SafeAreaView>
    );
  }

  const root      = parsedTripData?.tripPlan || parsedTripData;
  const itinerary = root?.itinerary || root?.daily_plan || root?.schedule;

  let tripDetails = {};
  try {
    tripDetails = parsedTripData.tripData
      ? JSON.parse(parsedTripData.tripData)
      : parsedTripData.trip_details || {};
  } catch { /* ignore */ }

  const locationInfo = tripDetails?.locationInfo || {};
  const apiKey       = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;
  const photoRef     = locationInfo?.photoRef;
  const imageUrl     = photoRef && apiKey
    ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=600&photoreference=${photoRef}&key=${apiKey}`
    : parsedTripData?.image || null;

  const destinationName =
    locationInfo?.name || locationInfo?.location ||
    parsedTripData?.location || root?.destination || 'Your Trip';

  const startDate  = tripDetails?.startDate;
  const traveler   = tripDetails?.traveler?.title || tripDetails?.traveler_type || 'Traveler';
  const rawDuration = root?.duration || tripDetails?.duration;
  const budget     = root?.budget || tripDetails?.budget_level || 'Moderate';
  const bestTime   = root?.bestTimeToVisit || root?.best_time_to_visit || null;

  if (!itinerary) {
    return (
      <SafeAreaView style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.safeBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.errorText}>No itinerary data found.</Text>
      </SafeAreaView>
    );
  }

  // ── Normalize every AI itinerary shape ──────────────────────────────────────
  // ── Normalize every AI itinerary shape ──────────────────────────────────────
  const normalizeActivity = (a) => {
    if (typeof a === 'string') {
      const p = parseStringActivity(a);
      return {
        timeSlot:      p.timeSlot,
        activityText:  p.activityText,
        ticketPricing: p.ticket_pricing || 'See local listings',
        travelTime:    p.time_to_travel || 'Varies',
        geoCoordinates: null,
      };
    }
    return {
      timeSlot:      a.time_slot      || a.timePeriod || a.time || 'Activity',
      activityText:  a.activity       || a.description || a.title || '',
      ticketPricing: a.ticket_pricing || a.ticketPricing || a.price || a.cost || 'See local listings',
      travelTime:    a.time_to_travel || a.travelTime   || a.estimated_duration || a.travel_time || 'Varies',
      geoCoordinates: a.geo_coordinate || a.geoCoordinates || null,
    };
  };
  const normalizedDays = Array.isArray(itinerary)
    ? itinerary.map((dayData, i) => {
        // Shape A: { day, activities: [...] }
        if (Array.isArray(dayData.activities)) {
          return {
            dayLabel: dayData.day ? String(dayData.day) : `Day ${i + 1}`,
            theme: dayData.theme || dayData.best_time_to_visit || dayData.plan || null,
            activities: dayData.activities.map(normalizeActivity),
          };
        }
        // Shape B: { day, plan: [...] }
        if (Array.isArray(dayData.plan)) {
          return {
            dayLabel: dayData.day ? String(dayData.day) : `Day ${i + 1}`,
            theme: dayData.theme || null,
            activities: dayData.plan.map(normalizeActivity),
          };
        }
        // Shape C: { day, plan: string, best_time_to_visit } — Tungnath-style, no activities array
        if (typeof dayData.plan === 'string') {
          return {
            dayLabel: dayData.day ? String(dayData.day) : `Day ${i + 1}`,
            theme: dayData.plan || dayData.best_time_to_visit || null,
            activities: [],
          };
        }
        return { dayLabel: `Day ${i + 1}`, theme: null, activities: [] };
      })
    : Object.entries(itinerary).map(([, dayData], i) => ({
        dayLabel: `Day ${i + 1}`,
        theme: dayData.theme || null,
        activities: Object.entries(dayData)
          .filter(([k]) => k !== 'theme')
          .map(([timePeriod, act]) => ({
            timeSlot:      timePeriod,
            activityText:  typeof act === 'string' ? act : (act.activity || act.description || ''),
            ticketPricing: act?.ticket_pricing || act?.ticketPricing || null,
            travelTime:    act?.time_to_travel || act?.travelTime   || null,
            geoCoordinates: act?.geo_coordinate || act?.geoCoordinates || null,
          })),
      }));

  // ── Safe duration (fixes the {days,nights} crash) ──
  const duration        = safeDuration(rawDuration, normalizedDays.length);
  const totalActivities = normalizedDays.reduce((sum, d) => sum + d.activities.length, 0);

  const isExpanded = (i) => (expandedDays[i] === undefined ? i === 0 : expandedDays[i]);
  const toggleDay  = (i) => setExpandedDays(prev => ({ ...prev, [i]: !prev[i] }));

  const expandAll  = () => {
    const all = {};
    normalizedDays.forEach((_, i) => { all[i] = true; });
    setExpandedDays(all);
  };
  const collapseAll = () => {
    const all = {};
    normalizedDays.forEach((_, i) => { all[i] = false; });
    setExpandedDays(all);
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Text style={{ fontSize: 72 }}>🌍</Text>
            </View>
          )}
          <View style={styles.heroOverlay}>
            <View style={styles.aiPill}>
              <Ionicons name="sparkles-outline" size={11} color="#FCD34D" />
              <Text style={styles.aiPillText}>AI-Curated Trip</Text>
            </View>
            <Text style={styles.heroTitle}>{destinationName}</Text>
            <View style={styles.heroMetaRow}>
              {startDate ? (
                <View style={styles.heroPill}>
                  <Ionicons name="calendar-outline" size={12} color="#fff" />
                  <Text style={styles.heroPillText}>{moment(startDate).format('DD MMM YYYY')}</Text>
                </View>
              ) : null}
              <View style={styles.heroPill}>
                <Ionicons name="people-outline" size={12} color="#fff" />
                <Text style={styles.heroPillText}>{traveler}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick stats banner */}
        <QuickStats totalActivities={totalActivities} totalDays={normalizedDays.length} />

        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard icon="time-outline"   label="Duration" value={duration} color="#6366F1" />
          <SummaryCard icon="wallet-outline" label="Budget"   value={budget}   color="#10B981" />
          <SummaryCard icon="sunny-outline"  label="Best Time" value={bestTime || 'Year Round'} color="#F59E0B" />
        </View>

        {/* Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗓  Daily Itinerary</Text>

          <View style={styles.expandRow}>
            <TouchableOpacity onPress={expandAll} style={styles.expandBtn}>
              <Ionicons name="chevron-down-outline" size={13} color={Colors.PRIMARY} />
              <Text style={styles.expandBtnText}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={collapseAll} style={[styles.expandBtn, { borderColor: '#E5E7EB' }]}>
              <Ionicons name="chevron-up-outline" size={13} color="#888" />
              <Text style={[styles.expandBtnText, { color: '#888' }]}>Collapse All</Text>
            </TouchableOpacity>
          </View>

          {normalizedDays.map((day, di) => (
            <View key={di} style={styles.dayBlock}>
              <TouchableOpacity style={styles.dayHeader} activeOpacity={0.85} onPress={() => toggleDay(di)}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{di + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayLabel}>{day.dayLabel}</Text>
                  {day.theme ? <Text style={styles.dayTheme}>{day.theme}</Text> : null}
                </View>
                <View style={styles.dayMeta}>
                  <View style={styles.actCount}>
                    <Text style={styles.actCountText}>{day.activities.length} acts</Text>
                  </View>
                  <Ionicons
                    name={isExpanded(di) ? 'chevron-up' : 'chevron-down'}
                    size={18} color="rgba(255,255,255,0.75)"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded(di) ? (
                <View style={styles.activitiesWrap}>
                  {day.activities.length === 0 ? (
                    <Text style={styles.noActivities}>No activities listed.</Text>
                  ) : (
                    day.activities.map((act, ai) => (
                      <ActivityCard key={ai} {...act} index={ai} />
                    ))
                  )}
                </View>
              ) : (
                <View style={styles.collapsedPreview}>
                  {day.activities.slice(0, 2).map((act, ai) => (
                    <View key={ai} style={styles.previewRow}>
                      <View style={[styles.previewDot, { backgroundColor: getTimeMeta(act.timeSlot).border }]} />
                      <Text style={styles.previewText} numberOfLines={1}>
                        {extractLabel(act.timeSlot)} · {act.activityText}
                      </Text>
                    </View>
                  ))}
                  {day.activities.length > 2 && (
                    <Text style={styles.moreText}>+{day.activities.length - 2} more · tap to expand</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Bonus: Checklist */}
        <View style={{ paddingHorizontal: 18 }}>
          <TripChecklist />
          <TravelLinks destination={destinationName} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },
  safeBack: { padding: 20, paddingTop: 50 },
  errorText: { textAlign: 'center', marginTop: 60, fontSize: 16, color: '#EF4444', fontFamily: 'poppins' },

  floatingBack: {
    position: 'absolute', top: 50, left: 18, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.52)', padding: 9, borderRadius: 22,
  },

  hero: { height: 300, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: { backgroundColor: Colors.PRIMARY + 'CC', justifyContent: 'center', alignItems: 'center' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 24,
    backgroundColor: 'rgba(10,10,25,0.62)',
  },
  aiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.22)',
    borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.7)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, marginBottom: 8,
  },
  aiPillText: { fontFamily: 'poppins-semi', fontSize: 10, color: '#FCD34D' },
  heroTitle: { fontFamily: 'poppins-semi', fontSize: 26, color: '#fff', marginBottom: 10 },
  heroMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroPillText: { fontFamily: 'poppins', fontSize: 12, color: '#fff' },

  quickStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    marginHorizontal: 18, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
    elevation: 5, shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatNum: { fontFamily: 'poppins-semi', fontSize: 19, color: '#fff' },
  quickStatLabel: { fontFamily: 'poppins', fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  quickStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.22)' },

  summaryGrid: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 18, marginTop: 14, marginBottom: 4,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 12, alignItems: 'center', gap: 5,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontFamily: 'poppins', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryValue: { fontFamily: 'poppins-semi', fontSize: 12, color: '#111827', textAlign: 'center' },

  section: { paddingHorizontal: 18, paddingBottom: 8, marginTop: 18 },
  sectionTitle: { fontFamily: 'poppins-semi', fontSize: 19, color: '#1a1a2e', marginBottom: 12 },

  expandRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9,
    borderWidth: 0.5, borderColor: Colors.PRIMARY + '44', backgroundColor: '#fff',
  },
  expandBtnText: { fontFamily: 'poppins-semi', fontSize: 11, color: Colors.PRIMARY },

  dayBlock: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 14,
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.PRIMARY, padding: 15,
  },
  dayBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  dayBadgeText: { fontFamily: 'poppins-semi', fontSize: 16, color: '#fff' },
  dayLabel: { fontFamily: 'poppins-semi', fontSize: 16, color: '#fff' },
  dayTheme: { fontFamily: 'poppins', fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
  dayMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actCount: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  actCountText: { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff' },

  collapsedPreview: { padding: 14, gap: 7, backgroundColor: '#FAFAFA' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  previewText: { fontFamily: 'poppins', fontSize: 12, color: '#555', flex: 1 },
  moreText: { fontFamily: 'poppins-semi', fontSize: 11, color: Colors.PRIMARY, marginTop: 2, marginLeft: 15 },

  activitiesWrap: { padding: 14, gap: 10 },
  noActivities: { fontFamily: 'poppins', color: '#aaa', fontSize: 13, padding: 8 },

  activityCard: {
    borderLeftWidth: 3, borderRadius: 12, padding: 13, marginBottom: 2,
  },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, marginBottom: 9,
  },
  timeBadgeIcon: { fontSize: 12 },
  timeBadgeLabel: { fontFamily: 'poppins-semi', fontSize: 11 },
  activityText: { fontFamily: 'poppins', fontSize: 14, color: '#1F2937', lineHeight: 21 },
  pillRow: { flexDirection: 'row', gap: 7, marginTop: 10, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 0.8,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  pillText: { fontFamily: 'poppins-semi', fontSize: 11 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, alignSelf: 'flex-start',
    borderWidth: 0.7,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  mapBtnText: { fontFamily: 'poppins-semi', fontSize: 12 },

  bonusCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  bonusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bonusTitle: { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e', flex: 1 },
  badgePill: {
    backgroundColor: Colors.PRIMARY + '18',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10,
  },
  badgePillText: { fontFamily: 'poppins-semi', fontSize: 12, color: Colors.PRIMARY },

  checklistBar: {
    height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginBottom: 14, overflow: 'hidden',
  },
  checklistBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },

  checkRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    borderBottomWidth: 0.5, borderColor: '#F3F4F6',
  },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  checkCircleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkText: { fontFamily: 'poppins', fontSize: 13, color: '#374151', flex: 1 },
  checkTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: 0.5, borderColor: '#F3F4F6',
  },
  linkIconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  linkText: { fontFamily: 'poppins', fontSize: 13, color: '#374151', flex: 1 },
});
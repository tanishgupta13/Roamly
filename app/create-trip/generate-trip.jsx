import {
  StyleSheet, Text, View, Alert, Animated, Easing, Dimensions,
} from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { chatSession } from '../../configs/AiModel';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../configs/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const C = {
  primary:  '#1A6B5A',
  accent:   '#F5A623',
  dark:     '#0D1F1B',
  card:     '#FFFFFF',
  bg:       '#F0F5F3',
  textMain: '#0D1F1B',
  textSub:  '#6B8A82',
};

// ─── Loading messages cycled while AI works ────────────────────────────────
const LOADING_STEPS = [
  { icon: '🌍', text: 'Mapping your destination...',     sub: 'Finding the best spots' },
  { icon: '✈️', text: 'Searching for flights...',        sub: 'Scanning live prices' },
  { icon: '🏨', text: 'Picking top hotels...',           sub: 'Curating best stays' },
  { icon: '🗓️', text: 'Building your itinerary...',      sub: 'Day-by-day planning' },
  { icon: '🍽️', text: 'Finding great restaurants...',    sub: 'Local & popular picks' },
  { icon: '📸', text: 'Adding hidden gems...',           sub: 'Off the beaten path' },
  { icon: '✨', text: 'Polishing your trip plan...',     sub: 'Almost ready!' },
];

// ─── Build the AI prompt ───────────────────────────────────────────────────
const buildPrompt = (tripData) => {
  const location    = tripData?.locationInfo?.name || 'the destination';
  const totalDays   = Number(tripData?.totalNumOfDays) || 3;
  const totalNights = totalDays - 1;
  const traveler    = tripData?.traveler?.title || 'Solo Traveler';
  const budget      = tripData?.budget || 'Moderate';
  const userCity    = tripData?.locationInfo?.userCity || 'Mumbai, India';

  return `
You are a professional travel planner. Generate a complete travel plan as a single valid JSON object.

Trip details:
- FROM: ${userCity}
- TO: ${location}
- Duration: ${totalDays} Days / ${totalNights} Nights
- Traveler type: ${traveler}
- Budget: ${budget}

CRITICAL OUTPUT RULES:
1. Return ONLY raw JSON. Zero markdown. Zero backticks. Zero explanation text.
2. Root JSON must have: itinerary, flight_details, hotel_options, places_to_visit_nearby, duration, budget, bestTimeToVisit
3. "itinerary" MUST be an array of exactly ${totalDays} day objects.
4. Each day: "day" (string), "theme" (string), "activities" (array of objects — NEVER strings).
5. Each activity MUST have ALL keys with non-null values:
   - "time_slot": "Morning" | "Afternoon" | "Evening" | "Night"
   - "activity": 2-3 sentence description
   - "ticket_pricing": NEVER null — "Free" or "₹200 per person"
   - "time_to_travel": NEVER null — "20 mins by auto"
   - "geo_coordinate": { "latitude": number, "longitude": number }
6. Include at least 1 MEAL activity per day with food cost.
7. Include 4-5 activities per day.
8. Flights MUST depart FROM ${userCity}.

Use this EXACT structure:
{
  "destination": "${location}",
  "duration": "${totalDays} Days",
  "budget": "${budget}",
  "bestTimeToVisit": "season string",
  "flight_details": {
    "flight_name": "airline from ${userCity}",
    "flight_price_inr": "₹5000-12000 round trip",
    "booking_url": "https://www.makemytrip.com/flights/"
  },
  "hotel_options": [
    { "hotel_name": "Name", "hotel_address": "Address", "price_per_night_inr": "₹2000-3500", "geo_coordinates": "lat, lng", "rating": "4.2", "description": "Two sentences." }
  ],
  "places_to_visit_nearby": [
    { "place_name": "Name", "place_details": "Two sentences.", "geo_coordinate": "lat, lng", "ticket_pricing_inr": "Free", "time_to_travel": "30 mins" }
  ],
  "itinerary": [
    {
      "day": "Day 1", "theme": "Arrival & Exploration",
      "activities": [
        { "time_slot": "Morning", "activity": "Arrive and check in.", "ticket_pricing": "Free", "time_to_travel": "30 mins from airport", "geo_coordinate": { "latitude": 0.0, "longitude": 0.0 } },
        { "time_slot": "Afternoon", "activity": "Local lunch.", "ticket_pricing": "₹300-500 per person", "time_to_travel": "10 mins walk", "geo_coordinate": { "latitude": 0.0, "longitude": 0.0 } }
      ]
    }
  ]
}

Generate the COMPLETE plan for ${totalDays} days in ${location}.
`.trim();
};

// ─── JSON repair helpers ───────────────────────────────────────────────────
const extractJson = (text) => {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || start >= end) throw new Error('No JSON found in AI response');
  return cleaned.substring(start, end + 1).trim();
};

const parseStringActivity = (str) => {
  const timeMatch = str.match(/^(Morning|Afternoon|Evening|Night)[:\s]/i);
  const timeSlot  = timeMatch ? timeMatch[1] : 'Morning';
  const text      = str.replace(/^(Morning|Afternoon|Evening|Night)[:\s]/i, '').trim();
  const priceMatch  = text.match(/(₹[\d,]+(?:\s*-\s*₹?[\d,]+)?|free|INR\s*[\d,]+)/i);
  const travelMatch = text.match(/(\d+(?:\s*-\s*\d+)?\s*(?:mins?|hrs?|hours?)(?:\s+(?:by\s+\w+|walk))?)/i);
  return {
    time_slot:      timeSlot,
    activity:       text,
    ticket_pricing: priceMatch  ? priceMatch[0]  : 'See local listings',
    time_to_travel: travelMatch ? travelMatch[0] : 'Varies',
    geo_coordinate: null,
  };
};

const repairGeoCoord = (geo) => {
  if (!geo) return null;
  if (typeof geo === 'object' && geo.latitude && geo.longitude) return geo;
  if (typeof geo === 'string') {
    const parts = geo.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
      return { latitude: parts[0], longitude: parts[1] };
  }
  return null;
};

const repairActivity = (a) => {
  if (typeof a === 'string') return repairActivity(parseStringActivity(a));
  return {
    time_slot:      a.time_slot || a.timePeriod || a.time || 'Morning',
    activity:       a.activity  || a.description || a.title || 'Activity',
    ticket_pricing: a.ticket_pricing || a.ticketPricing || a.price || 'See local listings',
    time_to_travel: a.time_to_travel || a.travelTime || a.travel_time || 'Varies',
    geo_coordinate: repairGeoCoord(a.geo_coordinate || a.geoCoordinates),
  };
};

const repairTripData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const repairDay = (d, i) => ({
    day:        typeof d.day === 'number' ? `Day ${d.day}` : (d.day || `Day ${i + 1}`),
    theme:      d.theme || d.plan || 'Exploration',
    activities: Array.isArray(d.activities) ? d.activities.map(repairActivity)
                : Array.isArray(d.plan)      ? d.plan.map(repairActivity)
                : [],
  });

  if      (Array.isArray(data.itinerary))   data.itinerary = data.itinerary.map(repairDay);
  else if (Array.isArray(data.daily_plan))  data.itinerary = data.daily_plan.map(repairDay);
  else if (Array.isArray(data.schedule))    data.itinerary = data.schedule.map(repairDay);

  return data;
};

// ─── Animated step row ─────────────────────────────────────────────────────
const StepRow = ({ step, active, done }) => (
  <View style={[LS.stepRow, active && LS.stepRowActive]}>
    <View style={[LS.stepIconWrap, done && LS.stepIconDone, active && LS.stepIconActive]}>
      {done
        ? <Ionicons name="checkmark" size={13} color="#fff" />
        : <Text style={LS.stepIconText}>{step.icon}</Text>
      }
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[LS.stepText, active && LS.stepTextActive]}>{step.text}</Text>
      {active && <Text style={LS.stepSub}>{step.sub}</Text>}
    </View>
    {active && <Ionicons name="ellipsis-horizontal" size={16} color={C.accent} />}
    {done   && <Ionicons name="checkmark-circle"    size={16} color={C.primary} />}
  </View>
);

// ─── Animated plane trail ──────────────────────────────────────────────────
const PlaneTrail = () => {
  const planeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(planeAnim, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateX = planeAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, width + 50] });
  return (
    <View style={LS.planeTrailWrap}>
      <Animated.Text style={[LS.planeEmoji, { transform: [{ translateX }] }]}>✈️</Animated.Text>
    </View>
  );
};

// ─── Main component ────────────────────────────────────────────────────────
export default function GenerateTrip() {
  const { tripData } = useContext(CreateTripContext);
  const router       = useRouter();

  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentStep,  setCurrentStep]  = useState(0);
  const [doneSteps,    setDoneSteps]    = useState([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Advance the visual step every ~2 seconds while generating
  useEffect(() => {
    const interval = setInterval(() => {
      setDoneSteps(prev => [...prev, currentStep]);
      setCurrentStep(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / LOADING_STEPS.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to generate trips');
      router.replace('/');
      return;
    }
    if (!tripData?.traveler || !tripData?.locationInfo) {
      Alert.alert('Error', 'Trip data is incomplete. Please go back and fill all details.');
      router.back();
      return;
    }
    if (!hasGenerated) generateAITrip();
  }, [user, authLoading, tripData]);

  const generateAITrip = async () => {
    if (hasGenerated) return;
    try {
      setHasGenerated(true);
      if (!user?.email) throw new Error('User not authenticated');
      if (!tripData)    throw new Error('Trip data missing');

      const prompt   = buildPrompt(tripData);
      const result   = await chatSession.sendMessage(prompt);
      const rawText  = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText)  throw new Error('Empty response from AI');

      const rawJson       = extractJson(rawText);
      let parsedTripData  = JSON.parse(rawJson);
      parsedTripData      = repairTripData(parsedTripData);

      // Best image
      let tripImage = null;
      const candidates = [
        parsedTripData?.places_to_visit_nearby?.[0]?.place_image_url,
        parsedTripData?.hotel_options?.[0]?.hotel_image_url,
      ];
      for (const url of candidates) {
        if (url && !url.includes('example.com') && url.startsWith('http')) {
          tripImage = url; break;
        }
      }
      if (!tripImage) {
        tripImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(tripData?.locationInfo?.name || 'travel')},landmark`;
      }

      const docId = Date.now().toString();
      await setDoc(doc(db, 'UserTrips', docId), {
        userEmail:  user.email,
        tripPlan:   parsedTripData,
        tripData:   JSON.stringify(tripData),
        tripImage,
        docId,
        createdAt:  new Date().toISOString(),
      });

      router.push('/(tabs)/mytrip');

    } catch (error) {
      console.error('GenerateTrip error:', error);
      Alert.alert(
        'Generation Failed',
        error?.message || 'Something went wrong. Please try again.',
        [{
          text: 'Go Back',
          onPress: () => {
            if (error?.message?.includes('authenticated')) router.replace('/');
            else router.back();
          },
        }]
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const destination = tripData?.locationInfo?.name || 'Your Destination';
  const days        = tripData?.totalNumOfDays || '?';

  if (authLoading) {
    return (
      <View style={LS.root}>
        <LinearGradient colors={[C.dark, C.primary]} style={StyleSheet.absoluteFill} />
        <Text style={LS.authText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[LS.root, { opacity: fadeAnim }]}>
      <LinearGradient colors={[C.dark, '#1A4A3A']} style={StyleSheet.absoluteFill} />

      {/* Animated plane */}
      <PlaneTrail />

      {/* ── Header ── */}
      <View style={LS.header}>
        <View style={LS.headerBadge}>
          <Ionicons name="sparkles" size={12} color={C.accent} />
          <Text style={LS.headerBadgeText}>AI is working</Text>
        </View>
        <Text style={LS.headerTitle}>Building Your Trip</Text>
        <Text style={LS.headerDest}>{destination}</Text>
        <View style={LS.headerChips}>
          <View style={LS.headerChip}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={LS.headerChipText}>{days} Days</Text>
          </View>
          <View style={LS.headerChip}>
            <Ionicons name="wallet-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={LS.headerChipText}>{tripData?.budget || '—'}</Text>
          </View>
          <View style={LS.headerChip}>
            <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={LS.headerChipText}>{tripData?.traveler?.title || '—'}</Text>
          </View>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={LS.progressWrap}>
        <View style={LS.progressTrack}>
          <Animated.View style={[LS.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={LS.progressLabel}>
          {Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100)}% complete
        </Text>
      </View>

      {/* ── Steps card ── */}
      <View style={LS.stepsCard}>
        {LOADING_STEPS.map((step, i) => (
          <StepRow
            key={i}
            step={step}
            active={i === currentStep}
            done={doneSteps.includes(i)}
          />
        ))}
      </View>

      {/* ── Footer note ── */}
      <View style={LS.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.5)" />
        <Text style={LS.footerNoteText}>Don't close the app — your trip is being crafted</Text>
      </View>
    </Animated.View>
  );
}

// ─── Loading screen styles ─────────────────────────────────────────────────
const LS = StyleSheet.create({
  root: { flex: 1, paddingTop: 60 },

  authText: { color: '#fff', fontFamily: 'poppins', fontSize: 15, textAlign: 'center', marginTop: 100 },

  planeTrailWrap: { position: 'absolute', top: 48, left: 0, right: 0, height: 36, overflow: 'hidden' },
  planeEmoji:     { position: 'absolute', fontSize: 24, top: 6 },

  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20, alignItems: 'center', gap: 6 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,166,35,0.2)',
    borderWidth: 0.5, borderColor: 'rgba(245,166,35,0.6)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4,
  },
  headerBadgeText: { fontFamily: 'poppins-semi', fontSize: 11, color: '#FCD34D' },
  headerTitle:     { fontFamily: 'poppins-semi', fontSize: 28, color: '#fff' },
  headerDest:      { fontFamily: 'poppins', fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  headerChips:     { flexDirection: 'row', gap: 8, marginTop: 6 },
  headerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  headerChipText: { fontFamily: 'poppins', fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  progressWrap:  { paddingHorizontal: 24, marginBottom: 16, gap: 6 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  progressLabel: { fontFamily: 'poppins-semi', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },

  stepsCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 6,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14,
  },
  stepRowActive: { backgroundColor: 'rgba(255,255,255,0.1)' },

  stepIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepIconDone:  { backgroundColor: C.primary },
  stepIconActive:{ backgroundColor: C.accent + '30', borderWidth: 1, borderColor: C.accent + '80' },
  stepIconText:  { fontSize: 16 },

  stepText:       { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  stepTextActive: { fontFamily: 'poppins-semi', color: '#fff' },
  stepSub:        { fontFamily: 'poppins', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  footerNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, marginTop: 'auto', paddingBottom: 44, paddingTop: 16,
    justifyContent: 'center',
  },
  footerNoteText: { fontFamily: 'poppins', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});

// Bring C into scope for LS
const { primary: _p } = C;
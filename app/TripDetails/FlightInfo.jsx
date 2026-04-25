// import {
//   StyleSheet, Text, View, TouchableOpacity,
//   Linking, SafeAreaView, ScrollView
// } from 'react-native';
// import React from 'react';
// import { Colors } from '../../constants/Colors';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import Ionicons from '@expo/vector-icons/Ionicons';

// // ─── Parse flight data from every possible key the AI might use ───────────────
// const parseFlightData = (raw) => {
//   if (!raw) return null;
//   const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
//   const root = parsed?.tripPlan || parsed;

//   // Your AI returns: root.flight_details = { flight_name, flight_price, booking_url }
//   // Also handle: root.flight (object or array), root.flights (array)
//   const fd = root?.flight_details || root?.flight || root?.flights || null;
//   if (!fd) return null;

//   // Normalise to array
//   const arr = Array.isArray(fd) ? fd : [fd];

//   return arr.map(f => ({
//     name:       f.flight_name  || f.airline      || f.name          || 'Flight',
//     price:      f.flight_price || f.price        || f.cost          || null,
//     bookingUrl: f.booking_url  || f.bookingUrl   || f.book_url      || null,
//     departure:  f.departure_time || f.departure  || f.departureTime || null,
//     arrival:    f.arrival_time   || f.arrival    || f.arrivalTime   || null,
//     duration:   f.duration       || f.flight_duration              || null,
//     airline:    f.airline        || null,
//     flightNo:   f.flight_number  || f.flightNumber                 || null,
//     cabin:      f.cabin_class    || f.class       || f.cabin        || null,
//   }));
// };

// // ─── Dashed divider (tear-off line) ──────────────────────────────────────────
// const TearLine = () => (
//   <View style={styles.tearLine}>
//     <View style={styles.tearCircleLeft} />
//     <View style={styles.tearDashes} />
//     <View style={styles.tearCircleRight} />
//   </View>
// );

// // ─── One info row inside the boarding pass ────────────────────────────────────
// const InfoRow = ({ icon, label, value }) => {
//   if (!value) return null;
//   return (
//     <View style={styles.infoRow}>
//       <Ionicons name={icon} size={15} color={Colors.PRIMARY} style={{ marginTop: 1 }} />
//       <View style={{ flex: 1 }}>
//         <Text style={styles.infoLabel}>{label}</Text>
//         <Text style={styles.infoValue}>{value}</Text>
//       </View>
//     </View>
//   );
// };

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// const FlightInfo = () => {
//   const router = useRouter();
//   const { tripData, destination } = useLocalSearchParams();

//   let flights = null;
//   try {
//     flights = parseFlightData(tripData || destination);
//   } catch (e) {
//     console.error('FlightInfo parse error:', e);
//   }

//   const hasFlights = flights && flights.length > 0;

//   return (
//     <SafeAreaView style={styles.screen}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//           <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Flight Details</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Decorative top banner */}
//         <View style={styles.banner}>
//           <Ionicons name="airplane" size={48} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
//           <Text style={styles.bannerTitle}>Your Flights</Text>
//           <Text style={styles.bannerSub}>
//             {hasFlights ? `${flights.length} flight${flights.length > 1 ? 's' : ''} found` : 'No flights in this plan'}
//           </Text>
//         </View>

//         {!hasFlights ? (
//           <View style={styles.emptyCard}>
//             <Text style={{ fontSize: 48, marginBottom: 12 }}>✈️</Text>
//             <Text style={styles.emptyTitle}>No flight info generated</Text>
//             <Text style={styles.emptyBody}>
//               This trip plan doesn't include specific flight details. You can search manually below.
//             </Text>
//             <TouchableOpacity
//               style={styles.searchBtn}
//               onPress={() => Linking.openURL('https://www.skyscanner.co.in')}
//             >
//               <Ionicons name="search-outline" size={16} color="#fff" />
//               <Text style={styles.searchBtnText}>Search on Skyscanner</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           flights.map((flight, index) => (
//             <View key={index} style={styles.boardingPass}>
//               {/* Top section — airline + flight number */}
//               <View style={styles.passTop}>
//                 <View style={styles.airlineRow}>
//                   <View style={styles.airlineLogo}>
//                     <Ionicons name="airplane" size={22} color={Colors.PRIMARY} />
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.airlineName}>{flight.name}</Text>
//                     {flight.flightNo ? (
//                       <Text style={styles.flightNo}>Flight {flight.flightNo}</Text>
//                     ) : null}
//                   </View>
//                   {flight.cabin ? (
//                     <View style={styles.cabinBadge}>
//                       <Text style={styles.cabinText}>{flight.cabin}</Text>
//                     </View>
//                   ) : null}
//                 </View>

//                 {/* Route line — from / to if available, else just a path graphic */}
//                 <View style={styles.routeRow}>
//                   <View style={styles.routeEndpoint}>
//                     <Text style={styles.routeTime}>{flight.departure || '—'}</Text>
//                     <Text style={styles.routeLabel}>Departure</Text>
//                   </View>
//                   <View style={styles.routeLine}>
//                     <View style={styles.routeDot} />
//                     <View style={styles.routeTrack} />
//                     <Ionicons name="airplane" size={18} color={Colors.PRIMARY} />
//                     <View style={styles.routeTrack} />
//                     <View style={styles.routeDot} />
//                   </View>
//                   <View style={[styles.routeEndpoint, { alignItems: 'flex-end' }]}>
//                     <Text style={styles.routeTime}>{flight.arrival || '—'}</Text>
//                     <Text style={styles.routeLabel}>Arrival</Text>
//                   </View>
//                 </View>

//                 {flight.duration ? (
//                   <Text style={styles.durationText}>⏱ {flight.duration}</Text>
//                 ) : null}
//               </View>

//               {/* Tear-off divider */}
//               <TearLine />

//               {/* Bottom section — price + details */}
//               <View style={styles.passBottom}>
//                 {flight.price ? (
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Estimated Price</Text>
//                     <Text style={styles.priceValue}>{flight.price}</Text>
//                   </View>
//                 ) : null}

//                 <InfoRow icon="calendar-outline" label="Departure" value={flight.departure} />
//                 <InfoRow icon="calendar-outline" label="Arrival"   value={flight.arrival} />
//                 <InfoRow icon="time-outline"     label="Duration"  value={flight.duration} />

//                 {flight.bookingUrl ? (
//                   <TouchableOpacity
//                     style={styles.bookBtn}
//                     onPress={() => Linking.openURL(flight.bookingUrl)}
//                   >
//                     <Ionicons name="open-outline" size={16} color="#fff" />
//                     <Text style={styles.bookBtnText}>Book this flight</Text>
//                   </TouchableOpacity>
//                 ) : (
//                   <TouchableOpacity
//                     style={[styles.bookBtn, styles.bookBtnSecondary]}
//                     onPress={() =>
//                       Linking.openURL(
//                         `https://www.google.com/search?q=book+${encodeURIComponent(flight.name)}+flight`
//                       )
//                     }
//                   >
//                     <Ionicons name="search-outline" size={16} color={Colors.PRIMARY} />
//                     <Text style={[styles.bookBtnText, { color: Colors.PRIMARY }]}>
//                       Search this flight
//                     </Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </View>
//           ))
//         )}

//         {/* Always show a manual search option at the bottom */}
//         {hasFlights && (
//           <View style={styles.altSearchCard}>
//             <Text style={styles.altSearchTitle}>Want to compare prices?</Text>
//             <View style={styles.altSearchRow}>
//               <TouchableOpacity
//                 style={styles.altBtn}
//                 onPress={() => Linking.openURL('https://www.skyscanner.co.in')}
//               >
//                 <Text style={styles.altBtnText}>Skyscanner</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.altBtn}
//                 onPress={() => Linking.openURL('https://www.makemytrip.com/flights/')}
//               >
//                 <Text style={styles.altBtnText}>MakeMyTrip</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.altBtn}
//                 onPress={() => Linking.openURL('https://www.goibibo.com/flights/')}
//               >
//                 <Text style={styles.altBtnText}>Goibibo</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default FlightInfo;

// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: '#F4F6FB' },

//   header: {
//     flexDirection: 'row', alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20, paddingTop: 50, paddingBottom: 14,
//     backgroundColor: '#F4F6FB',
//   },
//   backBtn: { padding: 4 },
//   headerTitle: { fontFamily: 'poppins-semi', fontSize: 20, color: '#1a1a2e' },

//   scrollContent: { paddingBottom: 40 },

//   // Banner
//   banner: {
//     backgroundColor: Colors.PRIMARY,
//     marginHorizontal: 18, marginBottom: 20,
//     borderRadius: 20, padding: 24,
//     overflow: 'hidden',
//   },
//   bannerIcon: { position: 'absolute', right: 16, top: 16 },
//   bannerTitle: { fontFamily: 'poppins-semi', fontSize: 22, color: '#fff', marginBottom: 4 },
//   bannerSub: { fontFamily: 'poppins', fontSize: 14, color: 'rgba(255,255,255,0.8)' },

//   // Empty state
//   emptyCard: {
//     backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 20,
//     padding: 28, alignItems: 'center',
//     elevation: 2, shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
//   },
//   emptyTitle: { fontFamily: 'poppins-semi', fontSize: 17, color: '#1a1a2e', marginBottom: 8 },
//   emptyBody: {
//     fontFamily: 'poppins', fontSize: 13, color: '#777',
//     textAlign: 'center', lineHeight: 20, marginBottom: 20,
//   },
//   searchBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     backgroundColor: Colors.PRIMARY,
//     paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12,
//   },
//   searchBtnText: { fontFamily: 'poppins-semi', fontSize: 14, color: '#fff' },

//   // Boarding pass
//   boardingPass: {
//     backgroundColor: '#fff', marginHorizontal: 18, marginBottom: 20,
//     borderRadius: 20, overflow: 'hidden',
//     elevation: 3, shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
//   },
//   passTop: { padding: 20 },
//   passBottom: { padding: 20 },

//   airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
//   airlineLogo: {
//     width: 44, height: 44, borderRadius: 12,
//     backgroundColor: '#EEF2FF',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   airlineName: { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e' },
//   flightNo: { fontFamily: 'poppins', fontSize: 12, color: '#888' },
//   cabinBadge: {
//     backgroundColor: '#E6F1FB', paddingHorizontal: 10,
//     paddingVertical: 4, borderRadius: 8,
//   },
//   cabinText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#0C447C' },

//   routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   routeEndpoint: { minWidth: 70 },
//   routeTime: { fontFamily: 'poppins-semi', fontSize: 14, color: '#1a1a2e' },
//   routeLabel: { fontFamily: 'poppins', fontSize: 11, color: '#999', marginTop: 2 },
//   routeLine: {
//     flex: 1, flexDirection: 'row',
//     alignItems: 'center', gap: 0,
//   },
//   routeDot: {
//     width: 6, height: 6, borderRadius: 3,
//     backgroundColor: Colors.PRIMARY,
//   },
//   routeTrack: { flex: 1, height: 1, backgroundColor: '#DDD' },
//   durationText: {
//     fontFamily: 'poppins', fontSize: 12, color: '#888',
//     textAlign: 'center', marginTop: 10,
//   },

//   // Tear line
//   tearLine: {
//     flexDirection: 'row', alignItems: 'center',
//     marginHorizontal: -1,
//   },
//   tearCircleLeft: {
//     width: 20, height: 20, borderRadius: 10,
//     backgroundColor: '#F4F6FB',
//     marginLeft: -10,
//   },
//   tearCircleRight: {
//     width: 20, height: 20, borderRadius: 10,
//     backgroundColor: '#F4F6FB',
//     marginRight: -10,
//   },
//   tearDashes: {
//     flex: 1, height: 1,
//     borderTopWidth: 1.5, borderColor: '#E0E0E0',
//     borderStyle: 'dashed',
//   },

//   priceRow: {
//     backgroundColor: '#F8FBFF', borderRadius: 12,
//     padding: 14, marginBottom: 14, alignItems: 'center',
//     borderWidth: 0.5, borderColor: '#D0E8FF',
//   },
//   priceLabel: { fontFamily: 'poppins', fontSize: 12, color: '#888', marginBottom: 2 },
//   priceValue: { fontFamily: 'poppins-semi', fontSize: 18, color: Colors.PRIMARY },

//   infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
//   infoLabel: { fontFamily: 'poppins', fontSize: 11, color: '#999' },
//   infoValue: { fontFamily: 'poppins-semi', fontSize: 13, color: '#1a1a2e', flexWrap: 'wrap' },

//   bookBtn: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
//     backgroundColor: Colors.PRIMARY,
//     paddingVertical: 12, borderRadius: 12, marginTop: 10,
//   },
//   bookBtnSecondary: {
//     backgroundColor: '#E6F1FB',
//     borderWidth: 0.5, borderColor: '#85B7EB',
//   },
//   bookBtnText: { fontFamily: 'poppins-semi', fontSize: 14, color: '#fff' },

//   // Compare row
//   altSearchCard: {
//     marginHorizontal: 18, backgroundColor: '#fff',
//     borderRadius: 16, padding: 16,
//     elevation: 2, shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
//   },
//   altSearchTitle: {
//     fontFamily: 'poppins-semi', fontSize: 14, color: '#1a1a2e',
//     marginBottom: 10,
//   },
//   altSearchRow: { flexDirection: 'row', gap: 8 },
//   altBtn: {
//     flex: 1, paddingVertical: 9, borderRadius: 10,
//     borderWidth: 0.5, borderColor: '#ccc',
//     backgroundColor: '#FAFAFA', alignItems: 'center',
//   },
//   altBtnText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#444' },
// });


import {
  StyleSheet, Text, View, TouchableOpacity,
  Linking, SafeAreaView, ScrollView, Animated, Easing,
} from 'react-native';
import React, { useRef, useEffect } from 'react';
import { Colors } from '../../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

// ─── Parse flight data — every possible AI shape ──────────────────────────────
const parseFlightData = (raw) => {
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const root   = parsed?.tripPlan || parsed;

  const fd = root?.flight_details || root?.flight || root?.flights || null;
  if (!fd) return null;

  // Normalise: could be a single object OR an array
  const arr = Array.isArray(fd) ? fd : [fd];

  return arr.map(f => ({
    name:       f.flight_name   || f.airline      || f.name          || 'Flight',
    price:      f.flight_price  || f.price        || f.cost          || null,
    bookingUrl: f.booking_url   || f.bookingUrl   || f.book_url      || null,
    departure:  f.departure_time || f.departure   || f.departureTime || null,
    arrival:    f.arrival_time   || f.arrival     || f.arrivalTime   || null,
    duration:   f.duration       || f.flight_duration               || null,
    airline:    f.airline        || null,
    flightNo:   f.flight_number  || f.flightNumber                  || null,
    cabin:      f.cabin_class    || f.class        || f.cabin        || null,
  }));
};

// ─── Animated plane icon ──────────────────────────────────────────────────────
const AnimatedPlane = () => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(moveAnim, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const translateX = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });
  const translateY = moveAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, 0] });

  return (
    <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
      <Ionicons name="airplane" size={52} color="rgba(255,255,255,0.25)" />
    </Animated.View>
  );
};

// ─── Dashed tear-off line ─────────────────────────────────────────────────────
const TearLine = () => (
  <View style={styles.tearLine}>
    <View style={styles.tearCircleLeft} />
    <View style={styles.tearDashes} />
    <View style={styles.tearCircleRight} />
  </View>
);

// ─── Route visualiser ─────────────────────────────────────────────────────────
const RouteBar = ({ departure, arrival }) => (
  <View style={styles.routeRow}>
    <View style={styles.routeEndpoint}>
      <Text style={styles.routeCode}>{departure ? departure.slice(0, 5) : '- -'}</Text>
      <Text style={styles.routeSmall}>Departure</Text>
    </View>
    <View style={styles.routeCenter}>
      <View style={styles.routeDot} />
      <View style={styles.routeTrack} />
      <Ionicons name="airplane" size={18} color={Colors.PRIMARY} />
      <View style={styles.routeTrack} />
      <View style={styles.routeDot} />
    </View>
    <View style={[styles.routeEndpoint, { alignItems: 'flex-end' }]}>
      <Text style={styles.routeCode}>{arrival ? arrival.slice(0, 5) : '- -'}</Text>
      <Text style={styles.routeSmall}>Arrival</Text>
    </View>
  </View>
);

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, color = Colors.PRIMARY }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

// ─── Booking site chip ────────────────────────────────────────────────────────
const BookingChip = ({ label, url }) => (
  <TouchableOpacity style={styles.chip} onPress={() => Linking.openURL(url)}>
    <Text style={styles.chipText}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FlightInfo = () => {
  const router = useRouter();
  const { tripData, destination } = useLocalSearchParams();

  let flights = null;
  try {
    flights = parseFlightData(tripData || destination);
  } catch (e) {
    console.error('FlightInfo parse error:', e);
  }

  const hasFlights = flights && flights.length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flight Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <View>
              <Text style={styles.bannerTitle}>
                {hasFlights ? `${flights.length} Flight${flights.length > 1 ? 's' : ''} Found` : 'No Flights Yet'}
              </Text>
              <Text style={styles.bannerSub}>
                {hasFlights ? 'Review your options below' : "We'll help you search"}
              </Text>
            </View>
            <AnimatedPlane />
          </View>

          {/* Decorative dots */}
          <View style={styles.bannerDots}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.bannerDot, { opacity: 0.15 + i * 0.1 }]} />
            ))}
          </View>
        </View>

        {/* Empty state */}
        {!hasFlights ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>✈️</Text>
            <Text style={styles.emptyTitle}>No flight data in plan</Text>
            <Text style={styles.emptyBody}>
              This trip plan doesn't include specific flight details. Search manually below.
            </Text>
            <View style={styles.searchSites}>
              <BookingChip label="Skyscanner"  url="https://www.skyscanner.co.in" />
              <BookingChip label="MakeMyTrip"  url="https://www.makemytrip.com/flights/" />
              <BookingChip label="Goibibo"     url="https://www.goibibo.com/flights/" />
              <BookingChip label="Google Flights" url="https://www.google.com/flights" />
            </View>
          </View>
        ) : (
          <>
            {flights.map((flight, index) => (
              <View key={index} style={styles.boardingPass}>

                {/* ── Top half ── */}
                <View style={styles.passTop}>
                  {/* Airline row */}
                  <View style={styles.airlineRow}>
                    <View style={styles.airlineLogo}>
                      <Ionicons name="airplane" size={22} color={Colors.PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.airlineName} numberOfLines={1}>{flight.name}</Text>
                      {flight.flightNo ? (
                        <Text style={styles.flightNo}>✦ {flight.flightNo}</Text>
                      ) : null}
                    </View>
                    {flight.cabin ? (
                      <View style={styles.cabinBadge}>
                        <Text style={styles.cabinText}>{flight.cabin}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Route bar */}
                  <RouteBar departure={flight.departure} arrival={flight.arrival} />

                  {flight.duration ? (
                    <View style={styles.durationChip}>
                      <Ionicons name="time-outline" size={12} color="#6366F1" />
                      <Text style={styles.durationText}>{flight.duration}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Tear line */}
                <TearLine />

                {/* ── Bottom half ── */}
                <View style={styles.passBottom}>
                  {/* Price */}
                  {flight.price ? (
                    <View style={styles.priceBox}>
                      <Ionicons name="pricetag-outline" size={14} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.priceLabel}>Estimated Price</Text>
                        <Text style={styles.priceValue}>{flight.price}</Text>
                      </View>
                    </View>
                  ) : null}

                  <InfoRow icon="calendar-outline" label="Departure" value={flight.departure} color="#6366F1" />
                  <InfoRow icon="calendar-outline" label="Arrival"   value={flight.arrival}   color="#F43F5E" />
                  <InfoRow icon="time-outline"     label="Duration"  value={flight.duration}  color="#F59E0B" />

                  {/* CTA */}
                  {flight.bookingUrl ? (
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() => Linking.openURL(flight.bookingUrl)}
                    >
                      <Ionicons name="open-outline" size={15} color="#fff" />
                      <Text style={styles.bookBtnText}>Book this Flight</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.bookBtnSecondary}
                      onPress={() =>
                        Linking.openURL(`https://www.google.com/search?q=book+${encodeURIComponent(flight.name)}+flight`)
                      }
                    >
                      <Ionicons name="search-outline" size={15} color={Colors.PRIMARY} />
                      <Text style={[styles.bookBtnText, { color: Colors.PRIMARY }]}>Search this Flight</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Compare sites */}
            <View style={styles.compareCard}>
              <View style={styles.compareHeader}>
                <Ionicons name="swap-horizontal-outline" size={18} color={Colors.PRIMARY} />
                <Text style={styles.compareTitle}>Compare Prices</Text>
              </View>
              <View style={styles.compareGrid}>
                <BookingChip label="Skyscanner"     url="https://www.skyscanner.co.in" />
                <BookingChip label="MakeMyTrip"     url="https://www.makemytrip.com/flights/" />
                <BookingChip label="Goibibo"        url="https://www.goibibo.com/flights/" />
                <BookingChip label="Google Flights" url="https://www.google.com/flights" />
              </View>
            </View>
          </>
        )}

        {/* Flight tips */}
        <View style={styles.tipsCard}>
          <View style={styles.compareHeader}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text style={styles.compareTitle}>Flight Tips</Text>
          </View>
          {[
            { icon: 'calendar-outline',      tip: 'Book 6–8 weeks in advance for best fares', color: '#6366F1' },
            { icon: 'time-outline',           tip: 'Tuesday & Wednesday flights are often cheapest', color: '#10B981' },
            { icon: 'shield-checkmark-outline', tip: 'Always consider travel insurance',          color: '#EF4444' },
            { icon: 'bag-outline',            tip: 'Carry-on only saves time and baggage fees',  color: '#F59E0B' },
          ].map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: t.color + '15' }]}>
                <Ionicons name={t.icon} size={14} color={t.color} />
              </View>
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default FlightInfo;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
    backgroundColor: '#F4F6FB',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: { fontFamily: 'poppins-semi', fontSize: 18, color: '#1a1a2e' },

  scrollContent: { paddingBottom: 40 },

  // Banner
  banner: {
    backgroundColor: Colors.PRIMARY,
    marginHorizontal: 18, marginBottom: 20, borderRadius: 22,
    padding: 22, overflow: 'hidden',
    elevation: 5, shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10,
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTitle: { fontFamily: 'poppins-semi', fontSize: 22, color: '#fff', marginBottom: 4 },
  bannerSub: { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  bannerDots: { flexDirection: 'row', gap: 6, marginTop: 16 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // Empty
  emptyCard: {
    backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 20,
    padding: 28, alignItems: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: 'poppins-semi', fontSize: 17, color: '#1a1a2e', marginBottom: 8 },
  emptyBody: {
    fontFamily: 'poppins', fontSize: 13, color: '#6B7280',
    textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  searchSites: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },

  // Boarding pass
  boardingPass: {
    backgroundColor: '#fff', marginHorizontal: 18, marginBottom: 20,
    borderRadius: 22, overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 9,
  },
  passTop:    { padding: 20 },
  passBottom: { padding: 20 },

  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  airlineLogo: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.PRIMARY + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  airlineName: { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e' },
  flightNo:   { fontFamily: 'poppins', fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  cabinBadge: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  cabinText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#4F46E5' },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeEndpoint: { minWidth: 72 },
  routeCode: { fontFamily: 'poppins-semi', fontSize: 15, color: '#1a1a2e' },
  routeSmall: { fontFamily: 'poppins', fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  routeCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.PRIMARY },
  routeTrack: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },

  durationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center', marginTop: 12,
    backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  durationText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#6366F1' },

  // Tear line
  tearLine: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
  tearCircleLeft: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F4F6FB', marginLeft: -11,
  },
  tearCircleRight: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F4F6FB', marginRight: -11,
  },
  tearDashes: {
    flex: 1, height: 0,
    borderTopWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },

  // Price box
  priceBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0FDF4', borderRadius: 12,
    padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: '#A7F3D0',
  },
  priceLabel: { fontFamily: 'poppins', fontSize: 11, color: '#6B7280', marginBottom: 2 },
  priceValue: { fontFamily: 'poppins-semi', fontSize: 17, color: '#059669' },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontFamily: 'poppins', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontFamily: 'poppins-semi', fontSize: 13, color: '#1a1a2e' },

  // Buttons
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 13, borderRadius: 13, marginTop: 12,
  },
  bookBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderWidth: 0.5, borderColor: '#C7D2FE',
    paddingVertical: 13, borderRadius: 13, marginTop: 12,
  },
  bookBtnText: { fontFamily: 'poppins-semi', fontSize: 14, color: '#fff' },

  // Compare card
  compareCard: {
    backgroundColor: '#fff', marginHorizontal: 18, marginBottom: 16, borderRadius: 18,
    padding: 18,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  compareHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  compareTitle: { fontFamily: 'poppins-semi', fontSize: 15, color: '#1a1a2e' },
  compareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 0.5,
    borderColor: Colors.PRIMARY + '44', backgroundColor: Colors.PRIMARY + '0C',
  },
  chipText: { fontFamily: 'poppins-semi', fontSize: 12, color: Colors.PRIMARY },

  // Tips
  tipsCard: {
    backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 18,
    padding: 18,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tipText: { fontFamily: 'poppins', fontSize: 12, color: '#4B5563', flex: 1, lineHeight: 18, marginTop: 5 },
});
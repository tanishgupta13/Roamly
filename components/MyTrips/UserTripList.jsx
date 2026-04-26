import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import moment from 'moment';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const unsplashKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const apiKey      = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;

// ── Resolves photo ref from all possible field names ──────────────────────────
const resolvePhotoRef = (locationInfo) => {
  if (!locationInfo) return null;
  return locationInfo.photoRef
    || locationInfo.photo_reference
    || locationInfo.photos?.[0]?.photo_reference
    || locationInfo.photos?.[0]?.photoRef
    || null;
};

const buildGooglePhotoUrl = (photoRef, maxwidth = 800) =>
  photoRef && apiKey
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoRef}&key=${apiKey}`
    : null;

const fetchUnsplash = async (locationName) => {
  try {
    const res  = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(locationName + ' travel')}&per_page=1&client_id=${unsplashKey}`
    );
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
};

// ── Small card with its own image state ───────────────────────────────────────
const TripListCard = ({ trip, onDelete, isPast, onPress }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  let tripData;
  try { tripData = JSON.parse(trip.tripData); } catch { return null; }

  const name   = tripData?.locationInfo?.name || 'Unknown';
  const date   = tripData?.startDate;
  const days   = tripData?.totalDays || tripData?.noOfDays;
  const person = tripData?.traveler?.title || 'Solo';
  const pRef   = resolvePhotoRef(tripData?.locationInfo);
  const gUrl   = buildGooglePhotoUrl(pRef, 400);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setImgLoading(true);
      if (gUrl) {
        setImgSrc({ uri: gUrl });
        setImgLoading(false);
        return;
      }
      // No Google photo — fetch Unsplash
      const url = await fetchUnsplash(name);
      if (!cancelled) {
        setImgSrc(url ? { uri: url } : null);
        setImgLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [trip.id]);

  const diff = date ? moment(date).diff(moment().startOf('day'), 'days') : null;
  const pill = diff === null  ? null
    : isPast                  ? 'Done'
    : diff === 0              ? 'Today'
    : diff === 1              ? 'Tomorrow'
    : diff > 0                ? `${diff}d away`
    : null;

  return (
    <TouchableOpacity style={styles.listCard} activeOpacity={0.88} onPress={onPress}>
      {/* Left image */}
      <View style={styles.listCardImageWrap}>
        {imgLoading ? (
          <View style={[styles.listCardImage, styles.listCardImageLoading]}>
            <ActivityIndicator size="small" color="#1A6B5A" />
          </View>
        ) : (
          <Image
            source={imgSrc || require('./../../assets/images/travel.jpg')}
            style={styles.listCardImage}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.listCardInfo}>
        <Text style={styles.listCardName} numberOfLines={1}>{name}</Text>
        <View style={styles.listCardRow}>
          {date && (
            <>
              <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
              <Text style={styles.listCardMeta}>{moment(date).format('DD MMM YY')}</Text>
            </>
          )}
          {days && (
            <>
              <Text style={styles.listCardDot}>·</Text>
              <Text style={styles.listCardMeta}>{days}d</Text>
            </>
          )}
          <Text style={styles.listCardDot}>·</Text>
          <Text style={styles.listCardMeta}>{person}</Text>
        </View>
        {pill && (
          <View style={[styles.listPill, isPast && { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.listPillText, isPast && { color: '#9CA3AF' }]}>{pill}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.listCardActions}>
        <TouchableOpacity
          style={styles.listDeleteBtn}
          onPress={(e) => { e.stopPropagation(); onDelete?.(trip.id, name); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
};

// ── Featured big card ─────────────────────────────────────────────────────────
const FeaturedCard = ({ trip, onDelete, isPast, onPress }) => {
  const [imgSrc,     setImgSrc]     = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  let tripData;
  try { tripData = JSON.parse(trip.tripData); } catch { return null; }

  const locName   = tripData?.locationInfo?.name || 'Unknown Location';
  const startDate = tripData?.startDate;
  const totalDays = tripData?.totalDays || tripData?.noOfDays;
  const traveler  = tripData?.traveler?.title || 'Solo';
  const pRef      = resolvePhotoRef(tripData?.locationInfo);
  const gUrl      = buildGooglePhotoUrl(pRef, 800);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setImgLoading(true);
      if (gUrl) {
        setImgSrc({ uri: gUrl });
        setImgLoading(false);
        return;
      }
      const url = await fetchUnsplash(locName);
      if (!cancelled) {
        setImgSrc(url ? { uri: url } : null);
        setImgLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [trip.id]);

  const diff = startDate ? moment(startDate).diff(moment().startOf('day'), 'days') : null;
  const daysLeft = diff === null ? null
    : diff === 0 ? 'Today!'
    : diff === 1 ? 'Tomorrow!'
    : diff > 0   ? `${diff} days away`
    : null;

  return (
    <TouchableOpacity style={styles.featuredCard} activeOpacity={0.92} onPress={onPress}>
      {imgLoading ? (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="large" color="#1A6B5A" />
        </View>
      ) : (
        <Image
          source={imgSrc || require('./../../assets/images/travel.jpg')}
          style={styles.featuredImage}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.featuredGradient}
      />

      {/* Top row */}
      <View style={styles.featuredTop}>
        <View style={{ flex: 1 }}>
          {isPast ? (
            <View style={[styles.badge, { backgroundColor: 'rgba(107,114,128,0.85)' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.badgeText}>Completed</Text>
            </View>
          ) : daysLeft ? (
            <View style={[styles.badge, { backgroundColor: 'rgba(26,107,90,0.9)' }]}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.badgeText}>{daysLeft}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={(e) => { e.stopPropagation(); onDelete?.(trip.id, locName); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredLocation} numberOfLines={1}>{locName}</Text>
        <View style={styles.featuredMeta}>
          {startDate && (
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText}>{moment(startDate).format('DD MMM YYYY')}</Text>
            </View>
          )}
          {totalDays && (
            <View style={styles.metaChip}>
              <Ionicons name="moon-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText}>{totalDays} days</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaText}>{traveler}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.seeplanBtn} onPress={onPress}>
          <Text style={styles.seeplanText}>See Plan</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ── Main list component ───────────────────────────────────────────────────────
const UserTripList = ({ userTrips, onDelete, isPast = false }) => {
  const router = useRouter();

  if (!userTrips || userTrips.length === 0) {
    return <Text>No trips found</Text>;
  }

  const handleTripPress = (trip) => {
    try {
      JSON.parse(trip.tripData);
      router.push({
        pathname: '/TripDetails',
        params: { tripData: JSON.stringify(trip) },
      });
    } catch (error) {
      console.error('Error handling trip press:', error);
    }
  };

  return (
    <View>
      {/* Featured card — first trip */}
      <FeaturedCard
        trip={userTrips[0]}
        onDelete={onDelete}
        isPast={isPast}
        onPress={() => handleTripPress(userTrips[0])}
      />

      {/* List cards — rest of trips, each with own image state */}
      {userTrips.slice(1).map((trip, index) => (
        <TripListCard
          key={trip.id || index}
          trip={trip}
          onDelete={onDelete}
          isPast={isPast}
          onPress={() => handleTripPress(trip)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Featured card
  featuredCard: {
    borderRadius: 22, overflow: 'hidden', height: 280,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 6,
    backgroundColor: '#1a1a2e',
  },
  imagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  featuredImage:    { width: '100%', height: '100%', position: 'absolute' },
  featuredGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },

  featuredTop: {
    position: 'absolute', top: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontFamily: 'poppins-semi', fontSize: 11, color: '#fff' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },

  featuredBottom:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  featuredLocation: { fontFamily: 'poppins-semi', fontSize: 22, color: '#fff', marginBottom: 8 },
  featuredMeta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  metaText:    { fontFamily: 'poppins', fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  seeplanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A6B5A', alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  seeplanText: { fontFamily: 'poppins-semi', fontSize: 13, color: '#fff' },

  // List cards
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    marginTop: 12, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  listCardImageWrap:    { borderRadius: 12, overflow: 'hidden' },
  listCardImage:        { width: 72, height: 72, borderRadius: 12, backgroundColor: '#E5E7EB' },
  listCardImageLoading: { justifyContent: 'center', alignItems: 'center' },
  listCardInfo:         { flex: 1, gap: 3 },
  listCardName:         { fontFamily: 'poppins-semi', fontSize: 14, color: '#1a1a2e' },
  listCardRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  listCardMeta:         { fontFamily: 'poppins', fontSize: 11, color: '#9CA3AF' },
  listCardDot:          { color: '#D1D5DB', fontSize: 12 },
  listPill: {
    alignSelf: 'flex-start', backgroundColor: '#1A6B5A' + '18',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 2,
  },
  listPillText:    { fontFamily: 'poppins-semi', fontSize: 10, color: '#1A6B5A' },
  listCardActions: { alignItems: 'center', gap: 8 },
  listDeleteBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
});

export default UserTripList;
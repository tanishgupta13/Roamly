import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, TextInput, Animated, Easing, ScrollView, Dimensions,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;
const UNSPLASH_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

const CATEGORY_QUERIES = {
  'Trending':    ['popular tourist attractions', 'famous landmarks world', 'iconic travel destinations', 'top tourist spots', 'world wonders travel'],
  'Asia':        ['best places Asia travel', 'famous temples Asia', 'Asia tourist attractions', 'beautiful places Southeast Asia', 'Asia landmarks'],
  'Europe':      ['Europe tourist attractions', 'famous European cities', 'historic Europe travel', 'beautiful European towns', 'Europe landmarks'],
  'Americas':    ['North America travel destinations', 'South America tourist spots', 'Latin America attractions', 'USA travel landmarks', 'Canada travel'],
  'Africa':      ['Africa safari destinations', 'African tourist attractions', 'North Africa travel', 'East Africa landmarks', 'Africa wonders'],
  'Middle East': ['Middle East tourist attractions', 'Dubai travel spots', 'ancient Middle East sites', 'Arabia travel destinations'],
  'Oceania':     ['Australia tourist attractions', 'New Zealand travel', 'Pacific islands travel', 'Oceania landmarks'],
  'Beach':       ['best beach destinations world', 'tropical island beaches', 'Caribbean beaches travel', 'Mediterranean beaches', 'Asia beach resorts'],
  'Adventure':   ['adventure travel destinations', 'trekking destinations world', 'extreme sports travel', 'mountain adventure spots', 'wilderness travel'],
};

const CATEGORIES = ['Trending', 'Asia', 'Europe', 'Americas', 'Africa', 'Middle East', 'Oceania', 'Beach', 'Adventure'];

const LOADING_MESSAGES = [
  { icon: '🌍', text: 'Finding amazing places...' },
  { icon: '✈️', text: 'Exploring the globe...' },
  { icon: '🗺️', text: 'Mapping destinations...' },
  { icon: '🏖️', text: 'Discovering hidden gems...' },
  { icon: '🌄', text: 'Almost there...' },
];

// ── FIX: Each trail dot gets its own offset so they fan out behind the plane ──
const TRAIL_OFFSETS = [-30, -55, -80, -105, -130]; // px behind the plane

const LoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const planeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Plane slide — uses translateX, which IS supported by native driver
    Animated.loop(
      Animated.sequence([
        Animated.timing(planeAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(planeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // Cycle messages
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.85, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // translateX range: plane travels from off-screen-left to off-screen-right
  const planeTranslateX = planeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, width + 40],
  });

  const msg = LOADING_MESSAGES[msgIndex];

  return (
    <View style={styles.loadingScreen}>
      {/* Trail dots — each offset behind the plane using translateX */}
      <View style={styles.trailRow}>
        {TRAIL_OFFSETS.map((offset, i) => {
          const dotTranslateX = planeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-40 + offset, width + 40 + offset],
          });
          const dotOpacity = planeAnim.interpolate({
            inputRange: [0, 0.05, 0.9, 1],
            outputRange: [0, 0.5 - i * 0.08, 0.5 - i * 0.08, 0],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.trailDot,
                {
                  transform: [{ translateX: dotTranslateX }],
                  opacity: dotOpacity,
                },
              ]}
            />
          );
        })}
        <Animated.Text style={[styles.planeEmoji, { transform: [{ translateX: planeTranslateX }] }]}>
          ✈️
        </Animated.Text>
      </View>

      {/* Message */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.loadingIcon}>{msg.icon}</Text>
        <Text style={styles.loadingTitle}>{msg.text}</Text>
        <Text style={styles.loadingSubtitle}>Powered by Google Places</Text>
      </Animated.View>

      <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 32 }} />
    </View>
  );
};

const fetchGooglePlaces = async (query, pageToken = null) => {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=tourist_attraction&key=${GOOGLE_KEY}`;
    if (pageToken) url += `&pagetoken=${pageToken}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('Places API:', data.status, data.error_message);
    }
    return data;
  } catch (e) {
    console.error('Google Places fetch error:', e);
    return { results: [], next_page_token: null };
  }
};

const getPlacePhotoUrl = (photoRef, maxWidth = 800) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_KEY}`;

const fetchUnsplashFallback = async (placeName) => {
  try {
    const page = Math.floor(Math.random() * 3) + 1;
    const res  = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(placeName + ' landmark travel')}&page=${page}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`
    );
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
};

const placeToCard = async (place, tag) => {
  const photoRef = place.photos?.[0]?.photo_reference;
  let   image    = photoRef ? getPlacePhotoUrl(photoRef) : null;
  if (!image) image = await fetchUnsplashFallback(place.name);
  if (!image) return null;

  const addressParts = (place.formatted_address || '').split(',');
  const shortLocation = addressParts.length >= 2
    ? addressParts.slice(-2).map(s => s.trim()).join(', ')
    : place.formatted_address || '';

  return {
    id:             place.place_id,
    title:          place.name,
    image,
    location:       shortLocation,
    fullAddress:    place.formatted_address,
    tag,
    rating:         place.rating,
    userRatings:    place.user_ratings_total,
    photoRef,
    isFromDiscover: true,
  };
};

export default function DiscoverScreen() {
  const router = useRouter();

  const [cards,          setCards]          = useState([]);
  const [bannerCards,    setBannerCards]    = useState([]);
  const [bannerIndex,    setBannerIndex]    = useState(0);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchText,     setSearchText]     = useState('');
  const [savedIds,       setSavedIds]       = useState(new Set());
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [pageTokens,     setPageTokens]     = useState([]);
  const [queryIndex,     setQueryIndex]     = useState(0);
  const [hasMore,        setHasMore]        = useState(true);

  const bannerAnim  = useRef(new Animated.Value(1)).current;
  const bannerTimer = useRef(null);

  useEffect(() => {
    if (bannerCards.length < 2) return;
    clearInterval(bannerTimer.current);
    bannerTimer.current = setInterval(() => {
      Animated.sequence([
        Animated.timing(bannerAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(bannerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setBannerIndex(i => (i + 1) % bannerCards.length);
    }, 4500);
    return () => clearInterval(bannerTimer.current);
  }, [bannerCards]);

  const loadCategory = useCallback(async (category) => {
    setLoadingInitial(true);
    setCards([]);
    setBannerCards([]);
    setHasMore(true);
    setQueryIndex(0);
    setPageTokens([]);

    const queries = CATEGORY_QUERIES[category] || CATEGORY_QUERIES['Trending'];
    const shuffled = [...queries].sort(() => Math.random() - 0.5);

    const fetches = await Promise.all(
      shuffled.slice(0, 2).map(q => fetchGooglePlaces(q))
    );

    const newCards = [];
    const tokens   = [];

    for (const data of fetches) {
      const converted = await Promise.all(
        (data.results || []).map(p => placeToCard(p, category))
      );
      newCards.push(...converted.filter(Boolean));
      if (data.next_page_token) tokens.push(data.next_page_token);
    }

    const seen = new Set();
    const unique = newCards.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    unique.sort(() => Math.random() - 0.5);

    setCards(unique);
    setBannerCards(unique.slice(0, 3));
    setPageTokens(tokens);
    setQueryIndex(2);
    setHasMore(tokens.length > 0 || shuffled.length > 2);
    setLoadingInitial(false);
  }, []);

  useEffect(() => { loadCategory('Trending'); }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const queries   = [...(CATEGORY_QUERIES[activeCategory] || [])].sort(() => Math.random() - 0.5);
    const newCards  = [];
    const newTokens = [];

    if (pageTokens.length > 0) {
      await new Promise(r => setTimeout(r, 2000));
      const fetches = await Promise.all(
        pageTokens.map(token => fetchGooglePlaces('', token))
      );
      for (const data of fetches) {
        const converted = await Promise.all(
          (data.results || []).map(p => placeToCard(p, activeCategory))
        );
        newCards.push(...converted.filter(Boolean));
        if (data.next_page_token) newTokens.push(data.next_page_token);
      }
    }

    if (queryIndex < queries.length) {
      const data = await fetchGooglePlaces(queries[queryIndex]);
      const converted = await Promise.all(
        (data.results || []).map(p => placeToCard(p, activeCategory))
      );
      newCards.push(...converted.filter(Boolean));
      if (data.next_page_token) newTokens.push(data.next_page_token);
    }

    setCards(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const fresh = newCards.filter(c => !existingIds.has(c.id));
      fresh.sort(() => Math.random() - 0.5);
      return [...prev, ...fresh];
    });

    setPageTokens(newTokens);
    setQueryIndex(i => i + 1);
    setHasMore(newTokens.length > 0 || queryIndex + 1 < queries.length);
    setLoadingMore(false);
  }, [loadingMore, hasMore, pageTokens, queryIndex, activeCategory]);

  const handleCategoryChange = (cat) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    loadCategory(cat);
  };

  const handleShuffle = () => loadCategory(activeCategory);

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const goToPlace = (item) => {
    router.push({ pathname: '/TripDetails', params: { tripData: JSON.stringify(item) } });
  };

  const filtered = searchText
    ? cards.filter(c =>
        c.title.toLowerCase().includes(searchText.toLowerCase()) ||
        c.location.toLowerCase().includes(searchText.toLowerCase())
      )
    : cards;

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => goToPlace(item)}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSave(item.id)}>
        <Ionicons
          name={savedIds.has(item.id) ? 'heart' : 'heart-outline'}
          size={18}
          color={savedIds.has(item.id) ? '#EF4444' : '#fff'}
        />
      </TouchableOpacity>
      {item.rating ? (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={9} color="#FCD34D" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      ) : null}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={12} color={Colors.PRIMARY} />
          <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
        </View>
        {item.userRatings ? (
          <Text style={styles.reviewCount}>{item.userRatings.toLocaleString()} reviews</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => {
    const banner = bannerCards[bannerIndex];
    return (
      <>
        {banner ? (
          <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={() => goToPlace(banner)}>
            <Animated.Image
              source={{ uri: banner.image }}
              style={[styles.bannerImage, { opacity: bannerAnim }]}
            />
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerPill}>
                <Ionicons name="flame-outline" size={11} color="#FCD34D" />
                <Text style={styles.bannerPillText}>Featured Destination</Text>
              </View>
              <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
              <Text style={styles.bannerLocation}>📍 {banner.location}</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => goToPlace(banner)}>
                <Text style={styles.bannerBtnText}>Plan This Trip</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.bannerDots}>
              {bannerCards.map((_, i) => (
                <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
              ))}
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places, cities, countries..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={15} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[styles.catPillText, activeCategory === cat && styles.catPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {activeCategory}
            <Text style={styles.sectionCount}> ({filtered.length}+)</Text>
          </Text>
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleBtn}>
            <Ionicons name="shuffle-outline" size={15} color={Colors.PRIMARY} />
            <Text style={styles.shuffleText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  if (loadingInitial) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Explore the world</Text>
          <Text style={styles.headerTitle}>Discover Places</Text>
        </View>
        {savedIds.size > 0 && (
          <View style={styles.savedBadge}>
            <Ionicons name="heart" size={13} color="#EF4444" />
            <Text style={styles.savedBadgeText}>{savedIds.size} saved</Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.footerText}>Loading more places...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>🌍</Text>
            <Text style={styles.emptyText}>No destinations found</Text>
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.emptyLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F6FB' },

  loadingScreen: {
    flex: 1, backgroundColor: '#F4F6FB',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  trailRow:     { position: 'absolute', top: '35%', left: 0, right: 0, height: 40 },
  planeEmoji:   { position: 'absolute', fontSize: 28, top: 0 },
  trailDot:     {
    position: 'absolute', width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.PRIMARY, top: 10,
  },
  loadingIcon:     { fontSize: 52, marginBottom: 16, marginTop: 80 },
  loadingTitle:    { fontFamily: 'poppins-semi', fontSize: 20, color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  loadingSubtitle: { fontFamily: 'poppins', fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  header:        {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 52, paddingBottom: 12, backgroundColor: '#F4F6FB',
  },
  headerSub:     { fontFamily: 'poppins', fontSize: 12, color: '#9CA3AF' },
  headerTitle:   { fontFamily: 'poppins-semi', fontSize: 24, color: '#1a1a2e' },
  savedBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  savedBadgeText:{ fontFamily: 'poppins-semi', fontSize: 12, color: '#EF4444' },

  banner:        { marginHorizontal: 18, borderRadius: 20, overflow: 'hidden', height: 220, marginBottom: 16 },
  bannerImage:   { width: '100%', height: '100%', position: 'absolute' },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(0,0,0,0.42)' },
  bannerPill:    {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.25)',
    borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.7)',
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginBottom: 6,
  },
  bannerPillText:  { fontFamily: 'poppins-semi', fontSize: 10, color: '#FCD34D' },
  bannerTitle:     { fontFamily: 'poppins-semi', fontSize: 20, color: '#fff', marginBottom: 4 },
  bannerLocation:  { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  bannerBtn:       {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.PRIMARY, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  bannerBtnText:   { fontFamily: 'poppins-semi', fontSize: 12, color: '#fff' },
  bannerDots:      { position: 'absolute', bottom: 14, right: 18, flexDirection: 'row', gap: 5 },
  dot:             { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:       { backgroundColor: '#fff', width: 16 },

  searchBar:     {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 18,
    paddingHorizontal: 14, paddingVertical: 11, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, marginBottom: 14,
  },
  searchInput:   { flex: 1, fontFamily: 'poppins', fontSize: 14, color: '#1F2937' },

  catPill:          {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  catPillActive:    { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  catPillText:      { fontFamily: 'poppins-semi', fontSize: 12, color: '#6B7280' },
  catPillTextActive:{ color: '#fff' },

  sectionRow:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 18, marginBottom: 12,
  },
  sectionTitle:  { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e' },
  sectionCount:  { fontFamily: 'poppins', color: '#9CA3AF', fontSize: 14 },
  shuffleBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shuffleText:   { fontFamily: 'poppins-semi', fontSize: 12, color: Colors.PRIMARY },

  listContent:   { paddingHorizontal: 18, paddingBottom: 30 },
  card:          {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  cardImage:     { height: 140, width: '100%' },
  saveBtn:       {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 20,
  },
  ratingBadge:   {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  ratingText:    { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff' },
  cardInfo:      { padding: 10 },
  cardTitle:     { fontFamily: 'poppins-semi', fontSize: 13, color: '#1a1a2e', marginBottom: 3 },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLocation:  { fontFamily: 'poppins', fontSize: 11, color: '#6B7280', flex: 1 },
  reviewCount:   { fontFamily: 'poppins', fontSize: 9, color: '#D1D5DB', marginTop: 3 },

  footer:        { alignItems: 'center', paddingVertical: 20, gap: 6 },
  footerText:    { fontFamily: 'poppins', fontSize: 12, color: '#9CA3AF' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { fontFamily: 'poppins-semi', fontSize: 16, color: '#6B7280', marginTop: 10 },
  emptyLink:     { fontFamily: 'poppins-semi', fontSize: 13, color: Colors.PRIMARY, marginTop: 8 },
});
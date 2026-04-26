import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, TextInput, Animated, Easing, ScrollView,
  Dimensions, Keyboard,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../configs/FirebaseConfig';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const { width } = Dimensions.get('window');
const GOOGLE_KEY   = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;
const UNSPLASH_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const SAVED_PLACES_KEY = 'roamly_saved_places';

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
const TRAIL_OFFSETS = [-30, -55, -80, -105, -130];

const LoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const planeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(planeAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(planeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
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

  const planeX = planeAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, width + 40] });
  const msg    = LOADING_MESSAGES[msgIndex];

  return (
    <View style={styles.loadingScreen}>
      <View style={styles.trailRow}>
        {TRAIL_OFFSETS.map((offset, i) => (
          <Animated.View key={i} style={[styles.trailDot, {
            transform: [{ translateX: planeAnim.interpolate({ inputRange: [0,1], outputRange: [-40+offset, width+40+offset] }) }],
            opacity: planeAnim.interpolate({ inputRange: [0,0.05,0.9,1], outputRange: [0, 0.5-i*0.08, 0.5-i*0.08, 0], extrapolate: 'clamp' }),
          }]} />
        ))}
        <Animated.Text style={[styles.planeEmoji, { transform: [{ translateX: planeX }] }]}>✈️</Animated.Text>
      </View>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.loadingIcon}>{msg.icon}</Text>
        <Text style={styles.loadingTitle}>{msg.text}</Text>
        <Text style={styles.loadingSubtitle}>Powered by Google Places</Text>
      </Animated.View>
      <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 32 }} />
    </View>
  );
};

const AutocompleteDropdown = React.memo(({ suggestions, onSelect, loading }) => {
  if (!suggestions.length && !loading) return null;
  return (
    <View style={styles.dropdownContainer}>
      {loading && (
        <View style={styles.dropdownLoader}>
          <ActivityIndicator size="small" color={Colors.PRIMARY} />
          <Text style={styles.dropdownLoaderText}>Searching...</Text>
        </View>
      )}
      {suggestions.map((item, index) => (
        <TouchableOpacity
          key={item.place_id}
          style={[styles.dropdownItem, index < suggestions.length - 1 && styles.dropdownItemBorder]}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.dropdownIconWrap}>
            <Ionicons name="location-outline" size={14} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dropdownMain} numberOfLines={1}>
              {item.structured_formatting?.main_text || item.description}
            </Text>
            <Text style={styles.dropdownSub} numberOfLines={1}>
              {item.structured_formatting?.secondary_text || ''}
            </Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={13} color="#CBD5E1" />
        </TouchableOpacity>
      ))}
    </View>
  );
});

const ListHeader = React.memo(({
  bannerCards, bannerIndex, bannerAnim,
  searchText, setSearchText,
  suggestions, autocompleteLoading, onSelectSuggestion,
  activeCategory, filteredCount,
  handleCategoryChange, handleShuffle, goToPlace,
  locationName, locationLoading,
  handleClearSearch, handleRefreshLocation,
  setLocationName, setLocationCards,
}) => {
  const banner = bannerCards[bannerIndex];
  return (
    <>
      {locationName ? (
        <View style={styles.locationBanner}>
          <View style={styles.locationBannerLeft}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={18} color={Colors.PRIMARY} />
            </View>
            <View>
              <Text style={styles.locationBannerTitle}>Places in {locationName}</Text>
              <Text style={styles.locationBannerSub}>
                {locationLoading ? 'Finding attractions...' : `${filteredCount} places found`}
              </Text>
            </View>
          </View>
          {locationLoading ? <ActivityIndicator size="small" color={Colors.PRIMARY} /> : null}
        </View>
      ) : banner ? (
        <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={() => goToPlace(banner)}>
          <Animated.Image source={{ uri: banner.image }} style={[styles.bannerImage, { opacity: bannerAnim }]} />
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

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search any place in the world..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            autoCorrect={false}
          />
          {/* X button — always shown when there's text, clears and resets */}
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setLocationName('');
                setLocationCards([]);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <AutocompleteDropdown
          suggestions={suggestions}
          onSelect={onSelectSuggestion}
          loading={autocompleteLoading}
        />
      </View>

      {/* Category pills — hidden during location search */}
      {!locationName && (
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
      )}

      {/* Section row */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {locationName ? locationName : activeCategory}
          {filteredCount > 0
            ? <Text style={styles.sectionCount}> ({filteredCount}+)</Text>
            : null}
        </Text>
        {/* Refresh button during location search, normal Refresh otherwise */}
        <TouchableOpacity
          onPress={locationName ? handleRefreshLocation : handleShuffle}
          style={styles.shuffleBtn}
        >
          <Ionicons name="refresh-outline" size={15} color={Colors.PRIMARY} />
          <Text style={styles.shuffleText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

// ─── API helpers ──────────────────────────────────────────────────────────────
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
    console.error('Google Places error:', e);
    return { results: [], next_page_token: null };
  }
};

const fetchAutocomplete = async (text) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=(regions)&key=${GOOGLE_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.predictions || [];
  } catch {
    return [];
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

  const addressParts  = (place.formatted_address || '').split(',');
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

// ─── Saved Trips Modal ────────────────────────────────────────────────────────
const SavedTripsModal = React.memo(({ visible, onClose, savedPlaces, onGoToPlace, onRemove }) => {
  if (!visible) return null;
  return (
    <View style={styles.savedModal}>
      <View style={styles.savedModalHeader}>
        <Text style={styles.savedModalTitle}>❤️ Saved Places</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={22} color="#1a1a2e" />
        </TouchableOpacity>
      </View>
      {savedPlaces.length === 0 ? (
        <View style={styles.savedEmpty}>
          <Text style={{ fontSize: 40 }}>💔</Text>
          <Text style={styles.savedEmptyText}>No saved places yet</Text>
          <Text style={styles.savedEmptySub}>Tap the heart on any place to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.savedCard} activeOpacity={0.88} onPress={() => onGoToPlace(item)}>
              <Image source={{ uri: item.image }} style={styles.savedCardImage} />
              <TouchableOpacity style={styles.savedRemoveBtn} onPress={() => onRemove(item.id)}>
                <Ionicons name="heart" size={16} color="#EF4444" />
              </TouchableOpacity>
              {item.rating ? (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={9} color="#FCD34D" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              <View style={styles.savedCardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardRow}>
                  <Ionicons name="location-outline" size={12} color={Colors.PRIMARY} />
                  <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const router = useRouter();

  const [cards,          setCards]          = useState([]);
  const [bannerCards,    setBannerCards]    = useState([]);
  const [bannerIndex,    setBannerIndex]    = useState(0);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [savedIds,       setSavedIds]       = useState(new Set());
  const [savedPlaces,    setSavedPlaces]    = useState([]);
  const [savedVisible,   setSavedVisible]   = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [pageTokens,     setPageTokens]     = useState([]);
  const [queryIndex,     setQueryIndex]     = useState(0);
  const [hasMore,        setHasMore]        = useState(true);

  const [searchText,          setSearchText]          = useState('');
  const [suggestions,         setSuggestions]         = useState([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [isSearchMode,        setIsSearchMode]        = useState(false);

  const [locationCards,        setLocationCards]        = useState([]);
  const [locationName,         setLocationName]         = useState('');
  const [locationLoading,      setLocationLoading]      = useState(false);
  const [locationDescription,  setLocationDescription]  = useState('');

  const autocompleteTimer = useRef(null);
  const bannerAnim        = useRef(new Animated.Value(1)).current;
  const bannerTimer       = useRef(null);
  const isSelecting       = useRef(false);

  // ── Load saved from AsyncStorage ─────────────────────────────────────────
 useFocusEffect(
  useCallback(() => {
    (async () => {
      try {
        const existing = await AsyncStorage.getItem(SAVED_PLACES_KEY);
        if (existing) {
          const parsed = JSON.parse(existing);
          setSavedPlaces(parsed);
          setSavedIds(new Set(parsed.map(p => p.id)));
        } else {
          setSavedPlaces([]);
          setSavedIds(new Set());
        }
      } catch (e) {
        console.warn('Load saved places error:', e);
      }
    })();
  }, [])
);

  // ── Banner rotate ─────────────────────────────────────────────────────────
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

  // ── Autocomplete debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSelecting.current) {
      isSelecting.current = false;
      return;
    }
    clearTimeout(autocompleteTimer.current);
    if (searchText.length < 2) {
      setSuggestions([]);
      setIsSearchMode(false);
      if (searchText.length === 0) {
        setLocationCards([]);
        setLocationName('');
        setLocationDescription('');
      }
      return;
    }
    setIsSearchMode(true);
    setAutocompleteLoading(true);
    autocompleteTimer.current = setTimeout(async () => {
      const results = await fetchAutocomplete(searchText);
      setSuggestions(results);
      setAutocompleteLoading(false);
    }, 350);
    return () => clearTimeout(autocompleteTimer.current);
  }, [searchText]);

  // ── Select suggestion ─────────────────────────────────────────────────────
  const onSelectSuggestion = useCallback(async (suggestion) => {
    isSelecting.current = true;
    Keyboard.dismiss();
    setSuggestions([]);
    setIsSearchMode(false);

    const cityName = suggestion.structured_formatting?.main_text || suggestion.description;
    setSearchText(cityName);
    setLocationName(cityName);
    setLocationDescription(suggestion.description);
    setLocationCards([]);
    setLocationLoading(true);

    try {
      const data = await fetchGooglePlaces(`tourist attractions in ${suggestion.description}`);
      const converted = await Promise.all(
        (data.results || []).map(p => placeToCard(p, 'Search'))
      );
      const valid = converted.filter(Boolean);
      valid.sort(() => Math.random() - 0.5);
      setLocationCards(valid);

      if (data.next_page_token) {
        await new Promise(r => setTimeout(r, 2000));
        const data2 = await fetchGooglePlaces('', data.next_page_token);
        const converted2 = await Promise.all(
          (data2.results || []).map(p => placeToCard(p, 'Search'))
        );
        setLocationCards(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          return [...prev, ...converted2.filter(Boolean).filter(c => !existingIds.has(c.id))];
        });
      }
    } catch (e) {
      console.warn('Location search error:', e);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // ── Load a category ───────────────────────────────────────────────────────
  const loadCategory = useCallback(async (category) => {
    setLoadingInitial(true);
    setCards([]);
    setBannerCards([]);
    setHasMore(true);
    setQueryIndex(0);
    setPageTokens([]);
    setSearchText('');
    setSuggestions([]);
    setIsSearchMode(false);
    setLocationCards([]);
    setLocationName('');
    setLocationDescription('');

    const queries  = CATEGORY_QUERIES[category] || CATEGORY_QUERIES['Trending'];
    const shuffled = [...queries].sort(() => Math.random() - 0.5);
    const fetches  = await Promise.all(shuffled.slice(0, 2).map(q => fetchGooglePlaces(q)));

    const newCards = [];
    const tokens   = [];
    for (const data of fetches) {
      const converted = await Promise.all((data.results || []).map(p => placeToCard(p, category)));
      newCards.push(...converted.filter(Boolean));
      if (data.next_page_token) tokens.push(data.next_page_token);
    }

    const seen   = new Set();
    const unique = newCards.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    unique.sort(() => Math.random() - 0.5);

    setCards(unique);
    setBannerCards(unique.slice(0, 3));
    setPageTokens(tokens);
    setQueryIndex(2);
    setHasMore(tokens.length > 0 || shuffled.length > 2);
    setLoadingInitial(false);
  }, []);

  useEffect(() => { loadCategory('Trending'); }, []);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isSearchMode || locationName) return;
    setLoadingMore(true);

    const queries   = [...(CATEGORY_QUERIES[activeCategory] || [])].sort(() => Math.random() - 0.5);
    const newCards  = [];
    const newTokens = [];

    if (pageTokens.length > 0) {
      await new Promise(r => setTimeout(r, 2000));
      const fetches = await Promise.all(pageTokens.map(token => fetchGooglePlaces('', token)));
      for (const data of fetches) {
        const converted = await Promise.all((data.results || []).map(p => placeToCard(p, activeCategory)));
        newCards.push(...converted.filter(Boolean));
        if (data.next_page_token) newTokens.push(data.next_page_token);
      }
    }

    if (queryIndex < queries.length) {
      const data      = await fetchGooglePlaces(queries[queryIndex]);
      const converted = await Promise.all((data.results || []).map(p => placeToCard(p, activeCategory)));
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
  }, [loadingMore, hasMore, pageTokens, queryIndex, activeCategory, isSearchMode, locationName]);

  const handleCategoryChange = useCallback((cat) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    loadCategory(cat);
  }, [activeCategory, loadCategory]);

  const handleShuffle = useCallback(() => loadCategory(activeCategory), [activeCategory, loadCategory]);

  // ── Refresh same location ─────────────────────────────────────────────────
  const handleRefreshLocation = useCallback(async () => {
    if (!locationDescription) return;
    setLocationCards([]);
    setLocationLoading(true);
    try {
      const data = await fetchGooglePlaces(`tourist attractions in ${locationDescription}`);
      const converted = await Promise.all(
        (data.results || []).map(p => placeToCard(p, 'Search'))
      );
      const valid = converted.filter(Boolean);
      valid.sort(() => Math.random() - 0.5);
      setLocationCards(valid);
    } catch (e) {
      console.warn('Refresh location error:', e);
    } finally {
      setLocationLoading(false);
    }
  }, [locationDescription]);

  // ── Toggle save ───────────────────────────────────────────────────────────
  const toggleSave = useCallback(async (id) => {
    const allCards = [...cards, ...locationCards];
    const item = allCards.find(c => c.id === id);
    const auth = getAuth();
    const user = auth.currentUser;
    const alreadySaved = savedIds.has(id);

    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    setSavedPlaces(prev => {
      if (alreadySaved) return prev.filter(p => p.id !== id);
      if (item) return [...prev, item];
      return prev;
    });

    try {
      const existing = await AsyncStorage.getItem(SAVED_PLACES_KEY);
      let saved = existing ? JSON.parse(existing) : [];
      if (alreadySaved) {
        saved = saved.filter(p => p.id !== id);
      } else if (item) {
        saved = [...saved, item];
      }
      await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(saved));

      if (user) {
        const ref = doc(db, 'users', user.uid, 'savedPlaces', id);
        if (alreadySaved) {
          await deleteDoc(ref);
        } else if (item) {
          await setDoc(ref, { ...item, savedAt: new Date().toISOString() });
        }
      }
    } catch (e) {
      console.warn('Save place error:', e);
    }
  }, [cards, locationCards, savedIds]);

  const goToPlace = useCallback((item) => {
    router.push({ pathname: '/TripDetails', params: { tripData: JSON.stringify(item) } });
  }, [router]);

  const displayCards = locationCards.length > 0 ? locationCards : cards;

  const renderCard = useCallback(({ item }) => (
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
  ), [savedIds, goToPlace, toggleSave]);

  const headerProps = useMemo(() => ({
    bannerCards, bannerIndex, bannerAnim,
    searchText, setSearchText,
    suggestions, autocompleteLoading, onSelectSuggestion,
    activeCategory,
    filteredCount: displayCards.length,
    handleCategoryChange, handleShuffle, goToPlace,
    locationName, locationLoading,
    handleRefreshLocation,
    setLocationName,
    setLocationCards,
  }), [
    bannerCards, bannerIndex, bannerAnim,
    searchText, suggestions, autocompleteLoading, onSelectSuggestion,
    activeCategory, displayCards.length,
    handleCategoryChange, handleShuffle, goToPlace,
    locationName, locationLoading,
    handleRefreshLocation,
  ]);

  if (loadingInitial) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Explore the world</Text>
          <Text style={styles.headerTitle}>Discover Places</Text>
        </View>
        {savedIds.size > 0 && (
          <TouchableOpacity style={styles.savedBadge} onPress={() => setSavedVisible(true)}>
            <Ionicons name="heart" size={13} color="#EF4444" />
            <Text style={styles.savedBadgeText}>{savedIds.size} saved</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayCards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={<ListHeader {...headerProps} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          locationLoading ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.footerText}>Finding more places in {locationName}...</Text>
            </View>
          ) : loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.footerText}>Loading more places...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          locationName && !locationLoading ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={styles.emptyText}>No places found in {locationName}</Text>
              <TouchableOpacity onPress={() => { setSearchText(''); setLocationName(''); setLocationCards([]); }}>
                <Text style={styles.emptyLink}>Clear search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🌍</Text>
              <Text style={styles.emptyText}>No destinations found</Text>
            </View>
          )
        }
      />

      {/* Saved Places Modal */}
      {savedVisible && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.savedOverlay} activeOpacity={1} onPress={() => setSavedVisible(false)} />
          <SavedTripsModal
            visible={savedVisible}
            onClose={() => setSavedVisible(false)}
            savedPlaces={savedPlaces}
            onGoToPlace={(item) => { setSavedVisible(false); goToPlace(item); }}
            onRemove={(id) => toggleSave(id)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },

  loadingScreen:   { flex: 1, backgroundColor: '#F4F6FB', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  trailRow:        { position: 'absolute', top: '35%', left: 0, right: 0, height: 40 },
  planeEmoji:      { position: 'absolute', fontSize: 28, top: 0 },
  trailDot:        { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.PRIMARY, top: 10 },
  loadingIcon:     { fontSize: 52, marginBottom: 16, marginTop: 80 },
  loadingTitle:    { fontFamily: 'poppins-semi', fontSize: 20, color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  loadingSubtitle: { fontFamily: 'poppins', fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, backgroundColor: '#F4F6FB' },
  headerSub:      { fontFamily: 'poppins', fontSize: 12, color: '#9CA3AF' },
  headerTitle:    { fontFamily: 'poppins-semi', fontSize: 24, color: '#1a1a2e' },
  savedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  savedBadgeText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#EF4444' },

  banner:        { marginHorizontal: 18, borderRadius: 20, overflow: 'hidden', height: 220, marginBottom: 16 },
  bannerImage:   { width: '100%', height: '100%', position: 'absolute' },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(0,0,0,0.42)' },
  bannerPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.25)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.7)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 6 },
  bannerPillText:{ fontFamily: 'poppins-semi', fontSize: 10, color: '#FCD34D' },
  bannerTitle:   { fontFamily: 'poppins-semi', fontSize: 20, color: '#fff', marginBottom: 4 },
  bannerLocation:{ fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  bannerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.PRIMARY, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  bannerBtnText: { fontFamily: 'poppins-semi', fontSize: 12, color: '#fff' },
  bannerDots:    { position: 'absolute', bottom: 14, right: 18, flexDirection: 'row', gap: 5 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:     { backgroundColor: '#fff', width: 16 },

  searchWrapper: { marginHorizontal: 18, marginBottom: 14, zIndex: 999 },
  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  searchInput:   { flex: 1, fontFamily: 'poppins', fontSize: 14, color: '#1F2937' },

  dropdownContainer: { backgroundColor: '#fff', borderRadius: 14, marginTop: 6, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8, overflow: 'hidden' },
  dropdownLoader:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  dropdownLoaderText:{ fontFamily: 'poppins', fontSize: 13, color: '#9CA3AF' },
  dropdownItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemBorder:{ borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  dropdownIconWrap:  { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.PRIMARY + '15', justifyContent: 'center', alignItems: 'center' },
  dropdownMain:      { fontFamily: 'poppins-semi', fontSize: 13, color: '#1a1a2e' },
  dropdownSub:       { fontFamily: 'poppins', fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  catPill:           { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  catPillActive:     { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  catPillText:       { fontFamily: 'poppins-semi', fontSize: 12, color: '#6B7280' },
  catPillTextActive: { color: '#fff' },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 18, marginBottom: 12 },
  sectionTitle: { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e' },
  sectionCount: { fontFamily: 'poppins', color: '#9CA3AF', fontSize: 14 },
  shuffleBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shuffleText:  { fontFamily: 'poppins-semi', fontSize: 12, color: Colors.PRIMARY },

  locationBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 14, backgroundColor: Colors.PRIMARY + '12', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.PRIMARY + '25' },
  locationBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.PRIMARY + '20', justifyContent: 'center', alignItems: 'center' },
  locationBannerTitle: { fontFamily: 'poppins-semi', fontSize: 14, color: '#1a1a2e' },
  locationBannerSub:   { fontFamily: 'poppins', fontSize: 11, color: '#6B7280', marginTop: 1 },

  listContent: { paddingHorizontal: 18, paddingBottom: 30 },
  card:        { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  cardImage:   { height: 140, width: '100%' },
  saveBtn:     { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 20 },
  ratingBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  ratingText:  { fontFamily: 'poppins-semi', fontSize: 10, color: '#fff' },
  cardInfo:    { padding: 10 },
  cardTitle:   { fontFamily: 'poppins-semi', fontSize: 13, color: '#1a1a2e', marginBottom: 3 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLocation:{ fontFamily: 'poppins', fontSize: 11, color: '#6B7280', flex: 1 },
  reviewCount: { fontFamily: 'poppins', fontSize: 9, color: '#D1D5DB', marginTop: 3 },

  footer:    { alignItems: 'center', paddingVertical: 20, gap: 6 },
  footerText:{ fontFamily: 'poppins', fontSize: 12, color: '#9CA3AF' },
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'poppins-semi', fontSize: 16, color: '#6B7280', marginTop: 10 },
  emptyLink: { fontFamily: 'poppins-semi', fontSize: 13, color: Colors.PRIMARY, marginTop: 8 },

  // Saved modal
  savedOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  savedModal:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  savedModalHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  savedModalTitle: { fontFamily: 'poppins-semi', fontSize: 18, color: '#1a1a2e' },
  savedEmpty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60 },
  savedEmptyText:  { fontFamily: 'poppins-semi', fontSize: 16, color: '#6B7280' },
  savedEmptySub:   { fontFamily: 'poppins', fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40 },
  savedCard:       { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  savedCardImage:  { height: 120, width: '100%' },
  savedRemoveBtn:  { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 20 },
  savedCardInfo:   { padding: 10 },
});
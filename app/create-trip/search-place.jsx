import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Dimensions, Animated,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { CreateTripContext } from '@/context/CreateTripContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const RECENT_KEY = 'roamly_recent_searches';
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;

const POPULAR_DESTINATIONS = [
  { name: 'Paris',     country: 'France',    emoji: '🗼' },
  { name: 'Bali',      country: 'Indonesia', emoji: '🌴' },
  { name: 'Tokyo',     country: 'Japan',     emoji: '🗾' },
  { name: 'New York',  country: 'USA',       emoji: '🗽' },
  { name: 'Dubai',     country: 'UAE',       emoji: '🌆' },
  { name: 'Santorini', country: 'Greece',    emoji: '🏛️' },
  { name: 'Maldives',  country: 'Maldives',  emoji: '🏝️' },
  { name: 'London',    country: 'UK',        emoji: '🎡' },
  { name: 'Rome',      country: 'Italy',     emoji: '🏟️' },
  { name: 'Sydney',    country: 'Australia', emoji: '🦘' },
  { name: 'Goa',       country: 'India',     emoji: '🌊' },
  { name: 'Barcelona', country: 'Spain',     emoji: '🎨' },
];

const TRIP_MOODS = [
  { label: 'Beach',     icon: 'sunny-outline',    places: ['Bali, Indonesia', 'Phuket, Thailand', 'Maldives', 'Goa, India', 'Santorini, Greece', 'Boracay, Philippines'] },
  { label: 'Mountain',  icon: 'triangle-outline', places: ['Himachal Pradesh, India', 'Swiss Alps, Switzerland', 'Queenstown, New Zealand', 'Banff, Canada', 'Innsbruck, Austria', 'Leh Ladakh, India'] },
  { label: 'City',      icon: 'business-outline', places: ['Singapore', 'Tokyo, Japan', 'New York, USA', 'Dubai, UAE', 'London, UK', 'Barcelona, Spain'] },
  { label: 'Adventure', icon: 'compass-outline',  places: ['Queenstown, New Zealand', 'Patagonia, Argentina', 'Nepal', 'Costa Rica', 'Iceland', 'Bhutan'] },
  { label: 'Culture',   icon: 'globe-outline',    places: ['Kyoto, Japan', 'Rome, Italy', 'Istanbul, Turkey', 'Marrakech, Morocco', 'Varanasi, India', 'Athens, Greece'] },
  { label: 'Romantic',  icon: 'heart-outline',    places: ['Santorini, Greece', 'Paris, France', 'Venice, Italy', 'Maldives', 'Bali, Indonesia', 'Prague, Czech Republic'] },
];

const EXPLORE_MORE = [
  { label: 'Hidden Gem',  icon: 'diamond-outline',      places: ['Kotor, Montenegro', 'Faroe Islands', 'Luang Prabang, Laos', 'Colmar, France', 'Tbilisi, Georgia', 'Chefchaouen, Morocco'], color: '#FDF4FF', iconColor: '#A855F7' },
  { label: 'Trending',    icon: 'trending-up-outline',  places: ['Tbilisi, Georgia', 'Baku, Azerbaijan', 'Medellín, Colombia', 'Tulum, Mexico', 'Lisbon, Portugal', 'Ho Chi Minh City, Vietnam'], color: '#EFF6FF', iconColor: '#3B82F6' },
  { label: 'Budget Pick', icon: 'wallet-outline',        places: ['Chiang Mai, Thailand', 'Bali, Indonesia', 'Tbilisi, Georgia', 'Budapest, Hungary', 'Vietnam', 'Nepal'], color: '#FFFBEB', iconColor: '#F59E0B' },
  { label: 'Luxury',      icon: 'star-outline',          places: ['Maldives', 'Dubai, UAE', 'Bora Bora, French Polynesia', 'Amalfi Coast, Italy', 'Seychelles', 'Monaco'], color: '#FFF1F2', iconColor: '#EF4444' },
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function SearchPlace() {
  const navigation          = useNavigation();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const router              = useRouter();

  const [searchText,   setSearchText]   = useState('');
  const [suggestions,  setSuggestions]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selecting,    setSelecting]    = useState(false);
  const [recentSearch, setRecentSearch] = useState([]);

  const inputRef    = useRef(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(20)).current;
  const searchAnim  = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_KEY);
        if (stored) setRecentSearch(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const saveRecentSearch = async (name) => {
    try {
      const updated = [name, ...recentSearch.filter(r => r !== name)].slice(0, 5);
      setRecentSearch(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecent = async (index) => {
    try {
      const updated = recentSearch.filter((_, i) => i !== index);
      setRecentSearch(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const onFocus = () => Animated.timing(searchAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(searchAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();

  const searchBorderColor = searchAnim.interpolate({
    inputRange: [0, 1], outputRange: ['#E5E7EB', '#1A6B5A'],
  });

  const searchPlaces = async (text) => {
    if (text.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_KEY}`
      );
      const data = await res.json();
      setSuggestions(data.predictions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text) => {
    setSearchText(text);
    clearTimeout(debounceRef.current);
    if (text.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => searchPlaces(text), 300);
  };

  // ── KEY FIX: setTripData sets locationInfo properly, preserving other fields ──
  const selectPlace = async (description, placeId) => {
    if (selecting) return;
    setSelecting(true);
    setSearchText(description);
    setSuggestions([]);

    try {
      const res     = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,photos,url&key=${GOOGLE_KEY}`
      );
      const data    = await res.json();
      const details = data.result;
      if (!details) throw new Error('No details returned');

      const locationInfo = {
        name:            description,
        coordinates:     details?.geometry?.location,
        photoRef:        details?.photos?.[0]?.photo_reference || null,
        photo_reference: details?.photos?.[0]?.photo_reference || null,
        url:             details?.url || null,
      };

      // ── FIX: preserve existing tripData fields, only update locationInfo ──
      setTripData(prev => ({
        ...(prev || {}),
        locationInfo,
      }));

      await saveRecentSearch(description);

      setTimeout(() => {
        router.push('/create-trip/select-traveler');
        setSelecting(false);
      }, 150);
    } catch (e) {
      console.error('Details error:', e);
      setSelecting(false);
    }
  };

  const quickSelect = async (placeName) => {
    if (selecting) return;
    setLoading(true);
    setSearchText(placeName);
    setSuggestions([]);
    try {
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(placeName)}&key=${GOOGLE_KEY}`
      );
      const data = await res.json();
      const first = data.predictions?.[0];
      if (first) {
        setLoading(false);
        await selectPlace(first.description, first.place_id);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const showSuggestions = suggestions.length > 0 && searchText.length >= 2;
  const showHome        = !showSuggestions && searchText.length < 2;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0D1F1B', '#1A6B5A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroEyebrow}>Plan Your Trip</Text>
          <Text style={styles.heroTitle}>Where to next? ✈️</Text>
          <Text style={styles.heroSub}>Search any city, country or landmark</Text>

          <Animated.View style={[styles.searchBar, { borderColor: searchBorderColor }]}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search destinations..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={handleTextChange}
              onFocus={onFocus}
              onBlur={onBlur}
              autoCorrect={false}
              returnKeyType="search"
            />
            {loading ? (
              <ActivityIndicator size="small" color="#1A6B5A" style={{ marginRight: 4 }} />
            ) : searchText.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      {selecting && (
        <View style={styles.selectingOverlay}>
          <ActivityIndicator size="large" color="#1A6B5A" />
          <Text style={styles.selectingText}>Setting up your destination...</Text>
        </View>
      )}

      {showSuggestions && !selecting && (
        <View style={styles.suggestionsCard}>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.place_id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.suggestionRow, index < suggestions.length - 1 && styles.suggestionBorder]}
                onPress={() => selectPlace(item.description, item.place_id)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons name="location-outline" size={15} color="#1A6B5A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  {!!item.structured_formatting?.secondary_text && (
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showHome && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {recentSearch.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                <View style={styles.recentCard}>
                  {recentSearch.map((r, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.recentRow, i < recentSearch.length - 1 && styles.recentBorder]}
                      onPress={() => quickSelect(r)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentIcon}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                      </View>
                      <Text style={styles.recentText} numberOfLines={1}>{r}</Text>
                      <TouchableOpacity
                        onPress={() => removeRecent(i)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={14} color="#D1D5DB" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles-outline" size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>What's Your Vibe?</Text>
              </View>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 4 }}
              >
                {TRIP_MOODS.map((mood, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.moodPill}
                    onPress={() => quickSelect(pickRandom(mood.places))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={mood.icon} size={16} color="#1A6B5A" />
                    <Text style={styles.moodText}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.vibeSub}>Tap a vibe to jump to a curated destination</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flame-outline" size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>Popular Destinations</Text>
              </View>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 6 }}
              >
                {POPULAR_DESTINATIONS.map((dest, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.destCard}
                    onPress={() => quickSelect(`${dest.name}, ${dest.country}`)}
                    activeOpacity={0.82}
                  >
                    <LinearGradient colors={['#F0F9F5', '#E0F2EC']} style={styles.destCardInner}>
                      <Text style={styles.destEmoji}>{dest.emoji}</Text>
                      <Text style={styles.destName}>{dest.name}</Text>
                      <Text style={styles.destCountry}>{dest.country}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="map-outline" size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>Explore More</Text>
              </View>
              <View style={styles.exploreGrid}>
                {EXPLORE_MORE.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.exploreCard, { backgroundColor: item.color }]}
                    onPress={() => quickSelect(pickRandom(item.places))}
                    activeOpacity={0.82}
                  >
                    <Ionicons name={item.icon} size={22} color={item.iconColor} />
                    <Text style={[styles.exploreLabel, { color: item.iconColor }]}>{item.label}</Text>
                    <Text style={[styles.explorePlace, { color: item.iconColor + 'BB' }]}>{item.places.length} destinations</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FB' },
  hero: {
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  heroEyebrow: { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  heroTitle:   { fontFamily: 'poppins-semi', fontSize: 26, color: '#fff', marginBottom: 4 },
  heroSub:     { fontFamily: 'poppins', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 13, paddingHorizontal: 14, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  searchInput: { flex: 1, fontFamily: 'poppins', fontSize: 15, color: '#1F2937' },
  selectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.93)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100, gap: 16,
  },
  selectingText: { fontFamily: 'poppins-semi', fontSize: 15, color: '#1A6B5A' },
  suggestionsCard: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#fff', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    maxHeight: height * 0.52, overflow: 'hidden',
  },
  suggestionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  suggestionBorder:{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1A6B5A15', justifyContent: 'center', alignItems: 'center' },
  suggestionMain:  { fontFamily: 'poppins-semi', fontSize: 14, color: '#1a1a2e' },
  suggestionSub:   { fontFamily: 'poppins', fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  section:       { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:  { fontFamily: 'poppins-semi', fontSize: 15, color: '#1a1a2e' },
  recentCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  recentRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  recentIcon:   { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  recentText:   { flex: 1, fontFamily: 'poppins', fontSize: 14, color: '#374151' },
  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  moodText: { fontFamily: 'poppins-semi', fontSize: 13, color: '#1A6B5A' },
  vibeSub:  { fontFamily: 'poppins', fontSize: 11, color: '#9CA3AF', paddingHorizontal: 20, marginTop: 8 },
  destCard: {
    width: 100, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  destCardInner: {
    alignItems: 'center', paddingVertical: 18, paddingHorizontal: 8,
    borderRadius: 16, borderWidth: 1, borderColor: '#D1EAE0',
  },
  destEmoji:   { fontSize: 30, marginBottom: 8 },
  destName:    { fontFamily: 'poppins-semi', fontSize: 12, color: '#1a1a2e', textAlign: 'center' },
  destCountry: { fontFamily: 'poppins', fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  exploreCard: {
    width: (width - 52) / 2, borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  exploreLabel: { fontFamily: 'poppins-semi', fontSize: 13, textAlign: 'center' },
  explorePlace: { fontFamily: 'poppins', fontSize: 10, textAlign: 'center' },
});
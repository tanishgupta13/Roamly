import {
  StyleSheet, Text, View, FlatList, Image,
  TouchableOpacity, SafeAreaView, Linking
} from 'react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;

const fetchGooglePhotoUrl = async (hotelName, hotelAddress) => {
  try {
    const query = encodeURIComponent(`${hotelName} ${hotelAddress}`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`
    );
    const data = await res.json();
    const photoRef = data?.results?.[0]?.photos?.[0]?.photo_reference;
    if (photoRef) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxheight=800&photoreference=${photoRef}&key=${API_KEY}`;
    }
  } catch (e) {
    console.warn('Places fetch failed for:', hotelName, e);
  }
  return null;
};

// Strips non-numeric chars and returns lowest price number, or Infinity if unparseable
const extractLowestPrice = (priceStr) => {
  if (!priceStr || typeof priceStr !== 'string') return Infinity;
  const nums = priceStr.replace(/,/g, '').match(/\d+/g);
  if (!nums) return Infinity;
  return Math.min(...nums.map(Number));
};

const openMap = (item) => {
  const lat = item.geo_coordinates?.latitude;
  const lng = item.geo_coordinates?.longitude;
  const name = encodeURIComponent(item.hotel_name || item.name || 'Hotel');
  const url =
    lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${name}`;
  Linking.openURL(url);
};

const openBooking = (item) => {
  const name = encodeURIComponent(item.hotel_name || item.name || 'Hotel');
  Linking.openURL(`https://www.google.com/search?q=book+${name}`);
};

const HotelList = () => {
  const router = useRouter();
  const { tripData, destination } = useLocalSearchParams();
  const [photoUrls, setPhotoUrls] = useState({});

  const hotelList = useMemo(() => {
    try {
      const raw = tripData || destination;
      const parsed = raw ? JSON.parse(raw) : {};
      const root = parsed?.tripPlan || parsed;
      return root?.hotels || root?.hotel_options || root?.hotel_list || [];
    } catch (e) {
      console.error('Parsing error:', e);
      return [];
    }
  }, [tripData, destination]);

  // Index of the hotel with the lowest starting price
  const bestValueIndex = useMemo(() => {
    if (hotelList.length === 0) return -1;
    let minPrice = Infinity;
    let minIdx = 0;
    hotelList.forEach((item, i) => {
      const p = extractLowestPrice(
        item.price_per_night || item.price || item.price_per_night_inr || ''
      );
      if (p < minPrice) {
        minPrice = p;
        minIdx = i;
      }
    });
    return minPrice < Infinity ? minIdx : -1;
  }, [hotelList]);

  useEffect(() => {
    if (!API_KEY || hotelList.length === 0) return;
    const fetchAll = async () => {
      const results = {};
      await Promise.all(
        hotelList.map(async (item, index) => {
          const name = item.hotel_name || item.name || '';
          const address = item.hotel_address || item.address || '';
          const url = await fetchGooglePhotoUrl(name, address);
          if (url) results[index] = url;
        })
      );
      setPhotoUrls(results);
    };
    fetchAll();
  }, [hotelList]);

  const renderHotelItem = ({ item, index }) => {
    const googleUrl = photoUrls[index];
    const aiUrl = item.image_url || item.hotel_image_url || item.image;
    const hasValidAiUrl = aiUrl?.startsWith('http') && !aiUrl.includes('example.com');
    const imageSource = googleUrl
      ? { uri: googleUrl }
      : hasValidAiUrl
      ? { uri: aiUrl }
      : require('./../../assets/images/travel.jpg');

    const description = item.description || item.hotel_description || null;
    const priceLabel =
      item.price_per_night || item.price || item.price_per_night_inr || 'Check price';
    const isBestValue = index === bestValueIndex;

    return (
      <View style={styles.card}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />

        <View style={styles.infoBox}>
          {/* Name */}
          <Text style={styles.hotelName} numberOfLines={1}>
            {item.hotel_name || item.name || 'Recommended Hotel'}
          </Text>

          {/* Address */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color="gray" />
            <Text style={styles.hotelAddress} numberOfLines={1}>
              {item.hotel_address || item.address || 'Address provided upon booking'}
            </Text>
          </View>

          {/* Description */}
          {description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {description}
              </Text>
            </View>
          ) : null}

          {/* Rating + Best Value badge + Price */}
          <View style={styles.badgeRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {item.rating || '4.0'}</Text>
            </View>
            {isBestValue && (
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>Best Value</Text>
              </View>
            )}
            <Text style={styles.priceText} numberOfLines={1}>
              {priceLabel}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(item)}>
              <Ionicons name="map-outline" size={15} color="#555" />
              <Text style={styles.mapBtnText}>View on map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookBtn} onPress={() => openBooking(item)}>
              <Ionicons name="open-outline" size={15} color="#0C447C" />
              <Text style={styles.bookBtnText}>Book now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotels</Text>
        <Text style={styles.hotelCount}>{hotelList.length} options</Text>
      </View>

      <View style={styles.container}>
        {hotelList.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No hotel recommendations found.</Text>
          </View>
        ) : (
          <FlatList
            data={hotelList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderHotelItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default HotelList;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#F7F7F7',
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontFamily: 'poppins-semi', fontSize: 24, flex: 1 },
  hotelCount: { fontFamily: 'poppins', fontSize: 13, color: 'gray' },

  container: { flex: 1 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 6 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },

  image: { width: '100%', height: 175 },

  infoBox: { padding: 15 },

  hotelName: {
    fontFamily: 'poppins-semi',
    fontSize: 17,
    color: '#111',
    marginBottom: 3,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  hotelAddress: {
    fontFamily: 'poppins',
    fontSize: 12,
    color: 'gray',
    flex: 1,
  },

  descriptionBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    paddingLeft: 10,
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: 'poppins',
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontFamily: 'poppins-medium', fontSize: 12, color: '#B8860B' },

  valueBadge: {
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valueText: { fontFamily: 'poppins-medium', fontSize: 12, color: '#0F6E56' },

  priceText: {
    fontFamily: 'poppins-semi',
    fontSize: 13,
    color: Colors.PRIMARY,
    marginLeft: 'auto',
  },

  divider: {
    height: 0.5,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#CCC',
    backgroundColor: '#FAFAFA',
  },
  mapBtnText: { fontFamily: 'poppins-medium', fontSize: 13, color: '#444' },

  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    backgroundColor: '#E6F1FB',
  },
  bookBtnText: { fontFamily: 'poppins-medium', fontSize: 13, color: '#0C447C' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'poppins', color: 'gray' },
});
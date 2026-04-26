import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, ToastAndroid } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { chatSession } from '@/configs/AiModel';

export default function TripDetailsIndex() {
  const router = useRouter();
  const { tripData, destination } = useLocalSearchParams();
  
  const rawString = tripData || destination;
  const [destData, setDestData] = useState(rawString ? JSON.parse(rawString) : null);
  const [loading, setLoading] = useState(false);

  // --- HELPER: UNIFY DATA KEYS ---
  // This ensures sub-pages always get the keys they expect (flight, hotels, itinerary)
  const getUnifiedData = (data) => {
    const tripPlan = data?.tripPlan || data;
    return {
      ...data,
      flight: tripPlan?.flight || tripPlan?.flight_details || tripPlan?.flights || [],
      hotels: tripPlan?.hotels || tripPlan?.hotel_options || tripPlan?.hotel_list || [],
      itinerary: tripPlan?.itinerary || tripPlan?.daily_plan || tripPlan?.schedule || []
    };
  };

  // --- IMAGE LOGIC ---
  const finalImageSource = useMemo(() => {
    if (!destData) return require('./../../assets/images/travel.jpg');
    if (destData.image && typeof destData.image === 'string' && destData.image.startsWith('http')) {
      return { uri: destData.image };
    }
    let photoRef = null;
    try {
      if (destData.tripData) {
        const parsedTrip = typeof destData.tripData === 'string' ? JSON.parse(destData.tripData) : destData.tripData;
        photoRef = parsedTrip?.locationInfo?.photoRef;
      }
    } catch (e) { console.error("Image Logic Error:", e); }

    if (photoRef) {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY;
      return { uri: `https://maps.googleapis.com/maps/api/place/photo?maxheight=800&photoreference=${photoRef}&key=${apiKey}` };
    }
    return require('./../../assets/images/travel.jpg');
  }, [destData]);

  const generateAiPlan = async () => {
    try {
      setLoading(true);
      // STRENGTHENED PROMPT: Forces specific keys and forbids "NA" values
      const prompt = `Generate a travel plan for ${destData.location || destData.title} in strict JSON format. 
      REQUIRED STRUCTURE:
      {
        "flight": [{"airline": "string", "price": "string", "departure_time": "string", "arrival_time": "string", "duration": "string"}],
        "hotels": [{"name": "string", "address": "string", "rating": "string", "price": "string"}],
        "itinerary": [
          {
            "day": 1,
            "theme": "string",
            "plan": [
              {
                "activity": "Detailed Place Name",
                "details": "Interesting facts",
                "travelTime": "e.g. 20 mins",
                "ticketPricing": "e.g. Free",
                "rating": "4.5",
                "best_time_to_visit": "Morning"
              }
            ]
          }
        ]
      }
      Do not use "NA". Provide real local data for ${destData.location || destData.title}. Return ONLY JSON.`;

      const result = await chatSession.sendMessage(prompt);
      let rawText = result.response.text ? result.response.text() : result.response.candidates[0].content.parts[0].text;
      
      const cleanJsonText = rawText.replace(/```json|```/g, "").trim();
      const aiResponse = JSON.parse(cleanJsonText);

      const updatedData = { ...destData, tripPlan: aiResponse, isFromDiscover: false };
      setDestData(updatedData);
      ToastAndroid.show('AI Itinerary Ready!', ToastAndroid.SHORT);
    } catch (error) {
      console.error("AI Error:", error);
      ToastAndroid.show('Failed to generate. Try again.', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  if (!destData) return <View style={styles.errorContainer}><Text>No data found</Text></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        <Image source={finalImageSource} style={styles.headerImage} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {destData.title || (destData.tripData ? (typeof destData.tripData === 'string' ? JSON.parse(destData.tripData) : destData.tripData)?.locationInfo?.name : 'Your Trip')}
        </Text>
        <Text style={styles.creditText}>{destData.photographer ? `📸 Photo by ${destData.photographer}` : 'Explore the world'}</Text>
        <View style={styles.divider} />

        {destData.isFromDiscover && !destData.tripPlan ? (
          <View style={styles.aiGenBox}>
            <Ionicons name="sparkles" size={50} color={Colors.PRIMARY} />
            <Text style={styles.aiTitle}>Generate Your Trip</Text>
            <Text style={styles.aiSub}>Roamly will create a unique flight, hotel, and daily plan for this spot.</Text>
            <TouchableOpacity style={styles.aiButton} onPress={generateAiPlan} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.WHITE} /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flash" size={20} color={Colors.WHITE} />
                  <Text style={styles.aiButtonText}>Generate AI Plan</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.menuTitle}>Trip Dashboard</Text>

            {/* Menu Cards: All now use JSON.stringify(getUnifiedData(destData)) */}
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push({ pathname: '/TripDetails/PlannedTrip', params: { tripData: JSON.stringify(getUnifiedData(destData)) } })}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="map" size={24} color="#1E88E5" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Itinerary</Text>
                <Text style={styles.menuItemSub}>View your daily planned trip</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.GRAY} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push({ pathname: '/TripDetails/FlightInfo', params: { tripData: JSON.stringify(getUnifiedData(destData)) } })}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="airplane" size={24} color="#8E24AA" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Flight Info</Text>
                <Text style={styles.menuItemSub}>Check terminal & boarding</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.GRAY} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push({ pathname: '/TripDetails/HotelList', params: { tripData: JSON.stringify(getUnifiedData(destData)) } })}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="bed" size={24} color="#43A047" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Hotels</Text>
                <Text style={styles.menuItemSub}>Recommended stays</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.GRAY} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.WHITE },
  imageContainer: { width: '100%', height: 350 },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 20 },
  contentContainer: { backgroundColor: Colors.WHITE, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 500 },
  title: { fontFamily: 'poppins-semi', fontSize: 26 },
  creditText: { fontFamily: 'poppins', fontSize: 12, color: Colors.GRAY, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  aiGenBox: { alignItems: 'center', paddingVertical: 20 },
  aiTitle: { fontFamily: 'poppins-semi', fontSize: 22, marginTop: 10 },
  aiSub: { fontFamily: 'poppins', textAlign: 'center', color: Colors.GRAY, marginVertical: 10 },
  aiButton: { backgroundColor: Colors.PRIMARY, padding: 18, borderRadius: 15, width: '100%', alignItems: 'center' },
  aiButtonText: { color: Colors.WHITE, fontFamily: 'poppins-semi', fontSize: 16, marginLeft: 10 },
  menuTitle: { fontFamily: 'poppins-semi', fontSize: 20, marginBottom: 15 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.WHITE, padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuItemTitle: { fontFamily: 'poppins-semi', fontSize: 16 },
  menuItemSub: { fontFamily: 'poppins', fontSize: 13, color: Colors.GRAY },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
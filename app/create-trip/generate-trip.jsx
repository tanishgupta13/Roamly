// import { View, Text, StyleSheet, Image, Alert } from 'react-native';
// import { CreateTripContext } from '../../context/CreateTripContext';
// import React, { useContext, useEffect, useState } from 'react';
// import { Colors } from '@/constants/Colors';
// import { AI_PROMPT } from '@/constants/data';
// import { chatSession } from '@/configs/AiModel';
// import { useRouter } from 'expo-router';
// import { doc, setDoc } from 'firebase/firestore';
// import { auth, db } from '@/configs/FirebaseConfig';
// import { onAuthStateChanged } from 'firebase/auth';

// export default function GenerateTrip() {
//     const { tripData, setTripData } = useContext(CreateTripContext);
//     const [loading, setLoading] = useState(false);
//     const [user, setUser] = useState(null);
//     const [authLoading, setAuthLoading] = useState(true);
//     const [hasGenerated, setHasGenerated] = useState(false);
//     const router = useRouter();
    
//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//             setUser(currentUser);
//             setAuthLoading(false);
//         });

//         return () => unsubscribe();
//     }, []);

//     useEffect(() => {
//         if (!authLoading) {
//             if (!user) {
//                 console.log('User not authenticated, redirecting...');
//                 Alert.alert('Authentication Error', 'Please log in to generate trips');
//                 router.replace('/');
//                 return;
//             }

//             if (!tripData || !tripData.traveler || !tripData.locationInfo) {
//                 console.log('Trip data incomplete');
//                 Alert.alert('Error', 'Trip data is incomplete. Please go back and fill all details.');
//                 router.back();
//                 return;
//             }

//             // Generate trip when both user and data are ready
//             if (user && tripData && tripData.traveler && tripData.locationInfo && !loading && !hasGenerated) {
//                 GenerateAITrip();
//             }
//         }
//     }, [user, authLoading, tripData]);

//     const cleanJsonString = (text) => {
//         try {
//             let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
//             const start = cleaned.indexOf('{');
//             const end = cleaned.lastIndexOf('}');
            
//             if (start === -1 || end === -1 || start >= end) {
//                 throw new Error('No valid JSON object found');
//             }
            
//             cleaned = cleaned.substring(start, end + 1).trim();
//             JSON.parse(cleaned);
//             return cleaned;
//         } catch (error) {
//             console.error('JSON cleaning failed:', error);
//             throw new Error('Failed to extract valid JSON from response');
//         }
//     };

//     const GenerateAITrip = async () => {
//         if (hasGenerated) return; // Prevent multiple calls
        
//         try {
//             setLoading(true);
//             setHasGenerated(true);
            
//             if (!user || !user.email) {
//                 throw new Error('User not authenticated');
//             }

//             if (!tripData) {
//                 throw new Error('Trip data is missing');
//             }

//             const FINAL_PROMPT = AI_PROMPT
//                 .replace('{location}', tripData?.locationInfo?.name || 'Unknown')
//                 .replace('{totalDay}', String(tripData?.totalNumOfDays || 1))
//                 .replace('{totalNight}', String((tripData?.totalNumOfDays - 1) || 0))
//                 .replace('{traveler}', tripData?.traveler?.title || 'Solo')
//                 .replace('{budget}', tripData?.budget || 'Moderate');

//             console.log('Sending prompt to AI...');
//             const result = await chatSession.sendMessage(FINAL_PROMPT);
            
//             if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
//                 throw new Error('Invalid AI response structure');
//             }

//             const responseText = result.response.candidates[0].content.parts[0].text;
//             console.log('Raw AI response:', responseText);

//             const cleanedJson = cleanJsonString(responseText);
//             console.log('Cleaned JSON:', cleanedJson);
            
//             // const parsedTripData = JSON.parse(cleanedJson);
//             // console.log('Parsed trip data:', parsedTripData);

//             // const docId = Date.now().toString();
//             // await setDoc(doc(db, "UserTrips", docId), {
//             //     userEmail: user.email,
//             //     tripPlan: parsedTripData,
//             //     tripData: JSON.stringify(tripData),
//             //     docId: docId,
//             //     createdAt: new Date().toISOString()
//             // });
//             const parsedTripData = JSON.parse(cleanedJson);
// console.log('Parsed trip data:', parsedTripData);

// // Try to find a meaningful image for the trip
// let tripImage = null;

// // 1️⃣ First preference: from AI response (placesToVisit or hotel images)
// tripImage =
//   parsedTripData?.placesToVisit?.[0]?.placeImageUrl ||
//   parsedTripData?.hotelOptions?.[0]?.hotelImageUrl;

// // 2️⃣ If AI returned a dummy URL like example.com, ignore it
// if (tripImage && tripImage.includes('example.com')) {
//   tripImage = null;
// }

// // 3️⃣ Fallback: Unsplash based on the location
// if (!tripImage) {
//   const locationName = tripData?.locationInfo?.name || 'travel';
//   tripImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(locationName)},tourist,landmark`;
// }

// console.log('Selected Trip Image:', tripImage);

// // Now save to Firestore
// const docId = Date.now().toString();
// await setDoc(doc(db, "UserTrips", docId), {
//   userEmail: user.email,
//   tripPlan: parsedTripData,
//   tripData: JSON.stringify(tripData),
//   tripImage: tripImage,          // 🆕 Store it here
//   docId: docId,
//   createdAt: new Date().toISOString()
// });


//             console.log('Trip saved successfully');
//             router.push('/(tabs)/mytrip');
            
//         } catch (error) {
//             console.error('Error generating trip:', error);
//             const errorMessage = error?.message || 'Unknown error occurred';
//             Alert.alert(
//                 'Error', 
//                 `Failed to generate trip: ${errorMessage}`,
//                 [
//                     {
//                         text: 'OK',
//                         onPress: () => {
//                             if (errorMessage.includes('authenticated')) {
//                                 router.replace('/');
//                             } else {
//                                 router.back();
//                             }
//                         }
//                     }
//                 ]
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (authLoading) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.title}>Loading...</Text>
//                 <Text style={styles.paragraph}>Checking authentication...</Text>
//             </View>
//         );
//     }

//     if (!user) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.title}>Authentication Required</Text>
//                 <Text style={styles.paragraph}>Redirecting to login...</Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Please Wait....</Text>
//             <Text style={styles.paragraph}>We are working on generating your dream Trip</Text>
//             <View style={styles.imageContainer}>
//                 <Image
//                     source={require('./../../assets/images/waitplane.gif')}
//                     style={styles.image}
//                     resizeMode="contain"
//                 />
//             </View>
//             <Text style={styles.paragraph}>Don't go back.</Text>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: Colors.WHITE,
//         paddingTop: 85,
//         padding: 25,
//         height: '100%'
//     },
//     title: {
//         fontFamily: 'poppins-semi',
//         fontSize: 30,
//         textAlign: 'center',
//         marginTop: 10,
//     },
//     paragraph: {
//         fontFamily: 'poppins-medium',
//         fontSize: 20,
//         textAlign: 'center',
//         marginTop: 20,
//     },
//     imageContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     image: {
//         width: '100%',
//         height: 200,
//         objectFit: 'contain'
//     },
//     paragraphGray: {
//         fontFamily: 'poppins',
//         fontSize: 20,
//         color: Colors.GRAY,
//         textAlign: 'center',
//     },
// });


import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { CreateTripContext } from '../../context/CreateTripContext';
import React, { useContext, useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { chatSession } from '@/configs/AiModel';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/configs/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Build the prompt here — no more importing AI_PROMPT from constants ───────
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES — VIOLATIONS WILL BREAK THE APP:
1. Return ONLY raw JSON. Zero markdown. Zero backticks. Zero explanation text.
2. The root JSON must have ALL of these keys: itinerary, flight_details, hotel_options, places_to_visit_nearby, duration, budget, bestTimeToVisit
3. "itinerary" MUST be an array of exactly ${totalDays} day objects.
4. Each day object MUST have: "day" (string), "theme" (string), "activities" (array of objects).
5. "activities" MUST be an array of OBJECTS — NEVER plain strings.
6. Each activity object MUST have ALL of these exact keys with non-null values:
   - "time_slot": exactly one of "Morning" | "Afternoon" | "Evening" | "Night"
   - "activity": 2-3 sentence description of what to do
   - "ticket_pricing": NEVER null — use "Free" or "₹200 per person" or "₹300-500 per person for meals"
   - "time_to_travel": NEVER null — use "20 mins by auto" or "5 mins walk" or "1 hour by bus"
   - "geo_coordinate": object with numeric "latitude" and "longitude" — NEVER a string
7. Include at least 1 MEAL activity per day with food cost in ticket_pricing.
8. Include 4-5 activities per day.
9. Flights MUST depart FROM ${userCity}.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use this EXACT JSON structure (no extra keys, no missing keys):

{
  "destination": "${location}",
  "duration": "${totalDays} Days",
  "budget": "${budget}",
  "bestTimeToVisit": "best season to visit as a string",
  "flight_details": {
    "flight_name": "airline name flying from ${userCity}",
    "flight_price_inr": "₹5000-12000 round trip",
    "booking_url": "https://www.makemytrip.com/flights/"
  },
  "hotel_options": [
    {
      "hotel_name": "Hotel Name",
      "hotel_address": "Full address",
      "price_per_night_inr": "₹2000-3500",
      "geo_coordinates": "lat, lng as a string",
      "rating": "4.2",
      "description": "Two sentence description of the hotel."
    }
  ],
  "places_to_visit_nearby": [
    {
      "place_name": "Place Name",
      "place_details": "Two sentence description.",
      "geo_coordinate": "lat, lng as a string",
      "ticket_pricing_inr": "Free or ₹200 per person",
      "time_to_travel": "30 mins from city center"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "theme": "Arrival & First Explorations",
      "activities": [
        {
          "time_slot": "Morning",
          "activity": "Arrive at the airport and check into your hotel. Freshen up and enjoy the hotel amenities. Take a short rest before starting the day.",
          "ticket_pricing": "Free",
          "time_to_travel": "30 mins from airport to hotel by taxi",
          "geo_coordinate": { "latitude": 12.9716, "longitude": 77.5946 }
        },
        {
          "time_slot": "Afternoon",
          "activity": "Lunch at a popular local restaurant. Try the regional specialties and street food. Great value for money in the area.",
          "ticket_pricing": "₹300-500 per person",
          "time_to_travel": "10 mins walk from hotel",
          "geo_coordinate": { "latitude": 12.9720, "longitude": 77.5950 }
        },
        {
          "time_slot": "Evening",
          "activity": "Visit the main market area and explore local shops. Pick up souvenirs and try evening street snacks. Great atmosphere as the sun sets.",
          "ticket_pricing": "Free entry, shopping budget extra",
          "time_to_travel": "15 mins by auto from hotel",
          "geo_coordinate": { "latitude": 12.9730, "longitude": 77.5960 }
        }
      ]
    }
  ]
}

Now generate the COMPLETE plan for ${totalDays} days in ${location}. Remember: activities must be objects, ticket_pricing and time_to_travel must never be null.
`;
};

// ─── Repair helpers — fix common Gemini quirks ────────────────────────────────

/** Extract raw JSON from a response that may have markdown fences or leading text */
const extractJson = (text) => {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find outermost { }
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No JSON object found in AI response');
  }
  return cleaned.substring(start, end + 1).trim();
};

/** 
 * Parse a plain string activity like "Morning: Visit temple. Entry ₹200. 20 mins walk."
 * into a structured object 
 */
const parseStringActivity = (str) => {
  const timeMatch = str.match(/^(Early Morning|Late Morning|Morning|Afternoon|Late Afternoon|Evening|Night)[:\s]/i);
  const timeSlot  = timeMatch ? timeMatch[1] : 'Morning';
  const text      = str.replace(/^(Early Morning|Late Morning|Morning|Afternoon|Late Afternoon|Evening|Night)[:\s]/i, '').trim();

  const priceMatch  = text.match(/(₹[\d,]+(?:\s*-\s*₹?[\d,]+)?(?:\s*per\s*\w+)?|free(?: of charge)?|no entry fee|INR\s*[\d,]+)/i);
  const travelMatch = text.match(/(\d+(?:\s*-\s*\d+)?\s*(?:min(?:ute)?s?|hrs?|hours?)(?:\s+(?:by\s+\w+|walk|drive|trek))?)/i);

  return {
    time_slot:      timeSlot,
    activity:       text,
    ticket_pricing: priceMatch  ? priceMatch[0]  : 'See local listings',
    time_to_travel: travelMatch ? travelMatch[0] : 'Varies by location',
    geo_coordinate: null,
  };
};

/**
 * Repair the parsed JSON — handle every known Gemini deviation:
 * - activities as strings instead of objects
 * - plan array instead of activities array  
 * - plan as a string (no activities at all)
 * - missing ticket_pricing / time_to_travel
 * - geo_coordinate as "lat, lng" string instead of object
 * - day number as integer instead of "Day 1" string
 */
const repairTripData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const repairGeoCoord = (geo) => {
    if (!geo) return null;
    if (typeof geo === 'object' && geo.latitude && geo.longitude) return geo;
    if (typeof geo === 'string') {
      const parts = geo.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { latitude: parts[0], longitude: parts[1] };
      }
    }
    return null;
  };

  const repairActivity = (a) => {
    // Plain string
    if (typeof a === 'string') return repairActivity(parseStringActivity(a));

    return {
      time_slot:      a.time_slot || a.timePeriod || a.time || 'Morning',
      activity:       a.activity  || a.description || a.title || 'Activity',
      ticket_pricing: a.ticket_pricing || a.ticketPricing || a.price || a.cost || 'See local listings',
      time_to_travel: a.time_to_travel || a.travelTime || a.travel_time || a.estimated_duration || 'Varies',
      geo_coordinate: repairGeoCoord(a.geo_coordinate || a.geoCoordinates || a.geo_coord),
    };
  };

  const repairDay = (dayData, index) => {
    let activities = [];

    if (Array.isArray(dayData.activities)) {
      activities = dayData.activities.map(repairActivity);
    } else if (Array.isArray(dayData.plan)) {
      activities = dayData.plan.map(repairActivity);
    } else if (typeof dayData.plan === 'string') {
      // plan is a title string, no activities — return empty
      activities = [];
    }

    return {
      day:        typeof dayData.day === 'number' ? `Day ${dayData.day}` : (dayData.day || `Day ${index + 1}`),
      theme:      dayData.theme || dayData.plan || dayData.best_time_to_visit || 'Exploration',
      activities,
    };
  };

  // Repair itinerary
  if (Array.isArray(data.itinerary)) {
    data.itinerary = data.itinerary.map(repairDay);
  } else if (Array.isArray(data.daily_plan)) {
    data.itinerary = data.daily_plan.map(repairDay);
  } else if (Array.isArray(data.schedule)) {
    data.itinerary = data.schedule.map(repairDay);
  }

  // Repair hotel geo_coordinates (sometimes returned as object instead of string)
  if (Array.isArray(data.hotel_options)) {
    data.hotel_options = data.hotel_options.map(h => ({
      ...h,
      hotel_image_url: (h.hotel_image_url && !h.hotel_image_url.includes('example.com'))
        ? h.hotel_image_url : null,
    }));
  }

  return data;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function GenerateTrip() {
  const { tripData } = useContext(CreateTripContext);
  const [loading,      setLoading]      = useState(false);
  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

    if (!loading && !hasGenerated) {
      GenerateAITrip();
    }
  }, [user, authLoading, tripData]);

  const GenerateAITrip = async () => {
    if (hasGenerated) return;

    try {
      setLoading(true);
      setHasGenerated(true);

      if (!user?.email) throw new Error('User not authenticated');
      if (!tripData)    throw new Error('Trip data is missing');

      const FINAL_PROMPT = buildPrompt(tripData);
      console.log('Sending prompt to AI...');

      const result = await chatSession.sendMessage(FINAL_PROMPT);

      const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error('Empty response from AI');

      console.log('Raw AI response:', responseText);

      // Step 1: Extract JSON
      const rawJson = extractJson(responseText);

      // Step 2: Parse
      let parsedTripData;
      try {
        parsedTripData = JSON.parse(rawJson);
      } catch (e) {
        throw new Error(`JSON parse failed: ${e.message}`);
      }

      // Step 3: Repair all known Gemini quirks
      parsedTripData = repairTripData(parsedTripData);
      console.log('Repaired trip data:', JSON.stringify(parsedTripData, null, 2));

      // Step 4: Pick best image
      let tripImage = null;
      const candidates = [
        parsedTripData?.places_to_visit_nearby?.[0]?.place_image_url,
        parsedTripData?.hotel_options?.[0]?.hotel_image_url,
        parsedTripData?.placesToVisit?.[0]?.placeImageUrl,
        parsedTripData?.hotelOptions?.[0]?.hotelImageUrl,
      ];
      for (const url of candidates) {
        if (url && !url.includes('example.com') && url.startsWith('http')) {
          tripImage = url;
          break;
        }
      }
      if (!tripImage) {
        const locationName = tripData?.locationInfo?.name || 'travel';
        tripImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(locationName)},travel,landmark`;
      }
      console.log('Trip image:', tripImage);

      // Step 5: Save to Firestore
      const docId = Date.now().toString();
      await setDoc(doc(db, 'UserTrips', docId), {
        userEmail:  user.email,
        tripPlan:   parsedTripData,
        tripData:   JSON.stringify(tripData),
        tripImage,
        docId,
        createdAt:  new Date().toISOString(),
      });

      console.log('Trip saved successfully');
      router.push('/(tabs)/mytrip');

    } catch (error) {
      console.error('Error generating trip:', error);
      Alert.alert(
        'Error',
        `Failed to generate trip: ${error?.message || 'Unknown error'}`,
        [{
          text: 'OK',
          onPress: () => {
            if (error?.message?.includes('authenticated')) router.replace('/');
            else router.back();
          },
        }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.paragraph}>Checking authentication...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.paragraph}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please Wait....</Text>
      <Text style={styles.paragraph}>We are working on generating your dream Trip</Text>
      <View style={styles.imageContainer}>
        <Image
          source={require('./../../assets/images/waitplane.gif')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.paragraph}>Don't go back.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.WHITE,
    paddingTop: 85, padding: 25, height: '100%',
  },
  title: {
    fontFamily: 'poppins-semi', fontSize: 30,
    textAlign: 'center', marginTop: 10,
  },
  paragraph: {
    fontFamily: 'poppins-medium', fontSize: 20,
    textAlign: 'center', marginTop: 20,
  },
  imageContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  image: {
    width: '100%', height: 200, objectFit: 'contain',
  },
});
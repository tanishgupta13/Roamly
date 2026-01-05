// import { View, Text } from 'react-native'
// import { useNavigation, useRouter } from 'expo-router';
// import React, { useContext, useEffect } from 'react'
// import { Colors } from '@/constants/Colors';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
// import 'react-native-get-random-values';
// import { CreateTripContext } from '@/context/CreateTripContext';

// export default function SearchPlace() {

//     const navigation=useNavigation();
//     const {tripData,setTripData}=useContext(CreateTripContext);
//     const router=useRouter();

//     useEffect(()=>{
//         navigation.setOptions({
//             headerShown:true,
//             headerTransparent:true,
//             headerTitle:'Search',
//         })
//     })

//     useEffect(()=>{
//       console.log(tripData);
//     },[tripData])
//   return (
//     <View
//     style={{
//         padding:25,
//         paddingTop:75,
//         backgroundColor:Colors.WHITE,
//         height:'100%'
//     }}>
//       <GooglePlacesAutocomplete
//       placeholder='Search Place'
//       fetchDetails={true}
//       onPress={(data, details = null) => {
//         // 'details' is provided when fetchDetails = true
//         setTripData({
//           locationInfo:{
//             name:data.description,
//             coordinates:details.geometry.location,
//             photoRef:details.photos[0].photo_reference,
//             url:details.url
//           }
//         })

//         router.push('/create-trip/select-traveler')
//       }}
//   //        onFail={error => console.log('Error:', error)}
//   // onNotFound={() => console.log('No results found')}
//       query={{
//         key: process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
//         language: 'en',
//       }}
//       styles={{
//         textInputContainer:{
//           borderWidth:1,
//           borderRadius:5,
//           marginTop:25,

//         }
//       }}
//     />
    
//     </View>
//   )
// }
// import { View, Text, ActivityIndicator } from 'react-native';
// import { useNavigation, useRouter } from 'expo-router';
// import React, { useContext, useEffect, useState } from 'react';
// import { Colors } from '@/constants/Colors';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
// import { CreateTripContext } from '@/context/CreateTripContext';
// import { generateTripPlan } from '@/configs/AiModel';

// export default function SearchPlace() {
//   const navigation = useNavigation();
//   const { tripData, setTripData } = useContext(CreateTripContext);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     navigation.setOptions({
//       headerShown: true,
//       headerTransparent: true,
//       headerTitle: 'Search',
//     });
//   }, []);

//   const handlePlaceSelect = async (data, details) => {
//     try {
//       setLoading(true);
      
//       if (!data || !details) {
//         console.error('Invalid place data');
//         return;
//       }

//       const locationName = data.description;

//       // Generate AI trip plan
//       const prompt = `Generate travel plan for location: ${locationName} for 3 Days and 2 Nights for Friends with a Moderate budget including flights, hotels, and nearby attractions in JSON format.`;
//       const aiPlan = await generateTripPlan(prompt);

//       // Save all into trip context
//       setTripData({
//         locationInfo: {
//           name: locationName,
//           coordinates: details?.geometry?.location,
//           photoRef: details?.photos?.[0]?.photo_reference,
//           url: details?.url
//         },
//         tripPlan: aiPlan
//       });

//       router.push('/create-trip/select-traveler');
//     } catch (error) {
//       console.error('Error in handlePlaceSelect:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
//         <ActivityIndicator size="large" color={Colors.PRIMARY} />
//         <Text style={{ marginTop: 10, fontFamily: 'poppins' }}>Generating trip...</Text>
//       </View>
//     );
//   }

//   return (
//     <View
//       style={{
//         padding: 25,
//         paddingTop: 75,
//         backgroundColor: Colors.WHITE,
//         height: '100%',
//       }}
//     >
//       <GooglePlacesAutocomplete
//         placeholder="Search Place"
//         fetchDetails={true}
//         onPress={handlePlaceSelect}
//         query={{
//           key: process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY,
//           language: 'en',
//         }}
//         styles={{
//           textInputContainer: {
//             borderWidth: 1,
//             borderRadius: 5,
//             marginTop: 25,
//           },
//         }}
//         enablePoweredByContainer={false}
//         listEmptyComponent={() => (
//           <View style={{ flex: 1 }}>
//             <Text>No results found</Text>
//           </View>
//         )}
//       />
//     </View>
//   );
// }
// import { View, Text, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
// import { useNavigation, useRouter } from 'expo-router';
// import React, { useContext, useEffect, useState } from 'react';
// import { Colors } from '@/constants/Colors';
// import { CreateTripContext } from '@/context/CreateTripContext';
// import { generateTripPlan } from '@/configs/AiModel';

// export default function SearchPlace() {
//   const navigation = useNavigation();
//   const { tripData, setTripData } = useContext(CreateTripContext);
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [searchText, setSearchText] = useState('');

//   useEffect(() => {
//     navigation.setOptions({
//       headerShown: true,
//       headerTransparent: true,
//       headerTitle: 'Search',
//     });
//   }, []);

//   const handleSearch = async () => {
//     if (!searchText.trim()) return;
    
//     try {
//       setLoading(true);
      
//       // Save location info
//       setTripData({
//         locationInfo: {
//           name: searchText,
//           coordinates: null,
//           photoRef: null,
//           url: null
//         }
//       });

//       router.push('/create-trip/select-traveler');
//     } catch (error) {
//       console.error('Error in handleSearch:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE }}>
//         <ActivityIndicator size="large" color={Colors.PRIMARY} />
//         <Text style={{ marginTop: 10, fontFamily: 'poppins' }}>Processing...</Text>
//       </View>
//     );
//   }

//   return (
//     <View
//       style={{
//         padding: 25,
//         paddingTop: 75,
//         backgroundColor: Colors.WHITE,
//         height: '100%',
//       }}
//     >
//       <TextInput
//         style={{
//           borderWidth: 1,
//           borderColor: Colors.GRAY,
//           borderRadius: 5,
//           padding: 15,
//           marginTop: 25,
//           fontSize: 16,
//           fontFamily: 'poppins'
//         }}
//         placeholder="Enter destination"
//         value={searchText}
//         onChangeText={setSearchText}
//       />
      
//       <TouchableOpacity
//         style={{
//           backgroundColor: Colors.PRIMARY,
//           padding: 15,
//           borderRadius: 5,
//           marginTop: 20,
//           alignItems: 'center'
//         }}
//         onPress={handleSearch}
//       >
//         <Text style={{ color: Colors.WHITE, fontFamily: 'poppins-medium', fontSize: 16 }}>
//           Continue
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { CreateTripContext } from '@/context/CreateTripContext';

export default function SearchPlace() {
  const navigation = useNavigation();
  const { tripData, setTripData } = useContext(CreateTripContext);
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: 'Search',
    });
  }, []);

  const searchPlaces = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
      );
      const data = await response.json();
      setSuggestions(data.predictions || []);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text) => {
    setSearchText(text);
    searchPlaces(text);
  };

  const selectPlace = async (place) => {
    setSearchText(place.description);
    setSuggestions([]);
    
    // Get place details
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
      );
      const data = await response.json();
      const details = data.result;

      setTripData({
        locationInfo: {
          name: place.description,
          coordinates: details?.geometry?.location,
          photoRef: details?.photos?.[0]?.photo_reference,
          url: details?.url
        }
      });

      router.push('/create-trip/select-traveler');
    } catch (error) {
      console.error('Details error:', error);
    }
  };

  return (
    <View style={{
      padding: 25,
      paddingTop: 75,
      backgroundColor: Colors.WHITE,
      height: '100%',
    }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: Colors.GRAY,
          borderRadius: 5,
          padding: 15,
          marginTop: 25,
          fontSize: 16,
          fontFamily: 'poppins'
        }}
        placeholder="Search destination..."
        value={searchText}
        onChangeText={handleTextChange}
      />

      {loading && (
        <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginTop: 10 }} />
      )}

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#eee'
            }}
            onPress={() => selectPlace(item)}
          >
            <Text style={{ fontFamily: 'poppins', fontSize: 16 }}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
        style={{ maxHeight: 300, marginTop: 10 }}
      />
    </View>
  );
}

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
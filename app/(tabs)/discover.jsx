// import { View, Text } from 'react-native'
// import React from 'react'

// export default function discover() {
//   return (
//     <View>
//       <Text>discover</Text>
//     </View>
//   )
// }

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';

const DiscoverScreen = ({ navigation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const unsplashKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

  useEffect(() => {
    const fetchTrendingPlaces = async () => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=world+travel+destinations&per_page=15&client_id=${unsplashKey}`
        );
        const data = await res.json();
        const formatted = data.results.map((item) => ({
          id: item.id,
          title: item.alt_description || 'Beautiful Destination',
          image: item.urls.regular,
          location: item.user?.location || 'Unknown',
          photographer: item.user?.name,
        }));
        setPlaces(formatted);
      } catch (err) {
        console.error('Error fetching destinations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingPlaces();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ color: Colors.PRIMARY, marginTop: 10 }}>Loading destinations...</Text>
      </View>
    );
  }

  const renderPlace = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('DestinationDetails', {
          destination: item,
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>📍 {item.location}</Text>
        <Text style={styles.credit}>📸 {item.photographer}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Discover Beautiful Places</Text>
      <FlatList
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heading: {
    fontFamily: 'poppins-medium',
    fontSize: 22,
    marginBottom: 10,
    color: Colors.PRIMARY,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
  },
  image: {
    height: 200,
    width: '100%',
  },
  info: {
    padding: 10,
  },
  title: {
    fontFamily: 'poppins-medium',
    fontSize: 17,
  },
  subtitle: {
    fontFamily: 'poppins',
    color: Colors.GRAY,
  },
  credit: {
    fontFamily: 'poppins',
    color: Colors.PRIMARY,
    fontSize: 12,
    marginTop: 3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DiscoverScreen;

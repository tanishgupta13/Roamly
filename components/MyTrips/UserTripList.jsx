import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import moment from 'moment';
import { Colors } from './../../constants/Colors';
import UserTripCard from './UserTripCard';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

const UserTripList = ({ userTrips }) => {
  const router = useRouter();
  const [fallbackImage, setFallbackImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);

  if (!userTrips || userTrips.length === 0) {
    return <Text>No trips found</Text>;
  }

  const latestTrip = userTrips[0];
  let latestTripData;
  try {
    latestTripData = JSON.parse(latestTrip.tripData);
  } catch (error) {
    console.error('Error parsing trip data:', error);
    return <Text>Error loading trip data</Text>;
  }

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
  const photoRef = latestTripData?.locationInfo?.photoRef;

  const imageUrl =
    photoRef && apiKey
      ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
      : null;
const unsplashKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

  useEffect(() => {
    const fetchUnsplashImage = async () => {
      try {
        const locationName = latestTripData?.locationInfo?.name || 'travel';
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            locationName
          )}&client_id=${unsplashKey}`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setFallbackImage(data.results[0].urls.regular);
        }
      } catch (err) {
        console.error('Error fetching Unsplash image:', err);
      } finally {
        setLoadingImage(false);
      }
    };

    if (!imageUrl) fetchUnsplashImage();
    else setLoadingImage(false);
  }, [latestTripData]);

  const handleTripPress = (trip) => {
    try {
      // 1. We keep the parsing logic to ensure the data is valid
      const parsedData = JSON.parse(trip.tripData);
      
      router.push({
        // 2. CHANGE: Point to the folder (index.jsx) instead of PlannedTrip
        pathname: '/TripDetails', 
        params: { 
          // 3. PASS: Send the entire trip object as a string
          tripData: JSON.stringify(trip) 
        },
      });
    } catch (error) {
      console.error('Error handling trip press:', error);
    }
  };

  return (
    <View style={{ marginTop: 20 }}>
      {loadingImage ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ height: 240 }} />
      ) : (
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : fallbackImage
              ? { uri: fallbackImage }
              : require('./../../assets/images/travel.jpg')
          }
          style={styles.image}
        />
      )}

      <View style={{ marginTop: 10 }}>
        <Text style={styles.paragraph}>
          {latestTripData?.locationInfo?.name || 'Unknown Location'}
        </Text>
        <View style={styles.flexContainer}>
          <Text style={styles.smallPara}>
            {latestTripData?.startDate
              ? moment(latestTripData.startDate).format('DD MMM YYYY')
              : 'No Date'}
          </Text>
          <Text style={styles.smallPara}>
            🚌 {latestTripData?.traveler?.title || 'Solo'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleTripPress(latestTrip)}
        >
          <Text style={styles.buttonText}>See Your Plan</Text>
        </TouchableOpacity>
      </View>

      {userTrips?.slice(1).map((trip, index) => (
        <TouchableOpacity key={index} onPress={() => handleTripPress(trip)}>
          <UserTripCard trip={trip} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
    borderRadius: 15,
  },
  paragraph: {
    fontFamily: 'poppins-medium',
    fontSize: 20,
  },
  smallPara: {
    fontFamily: 'poppins',
    fontSize: 17,
    color: Colors.GRAY,
  },
  flexContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 15,
    marginTop: 15,
  },
  buttonText: {
    textAlign: 'center',
    color: Colors.WHITE,
    fontFamily: 'poppins-medium',
    fontSize: 15,
  },
});

export default UserTripList;

// import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// import moment from 'moment'
// import { Colors } from './../../constants/Colors';
// import UserTripCard from './UserTripCard';
// import { useRouter } from 'expo-router';

// const UserTripList = ({ userTrips }) => {
//     const router = useRouter();
    
//     // Add this check
//     if (!userTrips || userTrips.length === 0) {
//         return <Text>No trips found</Text>;
//     }
    
//     const latestTrip = userTrips[0];
//     const latestTripData = JSON.parse(latestTrip.tripData);
//     const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
//     const photoRef = latestTripData?.locationInfo?.photoRef;

//     const imageUrl = photoRef && apiKey 
//       ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
//       : null;

//     const handleTripPress = (trip) => {
//       const tripData = JSON.parse(trip.tripData);
      
//       if (tripData.flightInfo) {
//         router.push({
//           pathname: '/TripDetails/FlightInfo',
//           params: { tripData: JSON.stringify(trip) }
//         });
//       }
      
//       if (tripData.hotelInfo) {
//         router.push({
//           pathname: '/TripDetails/HotelList',
//           params: { tripData: JSON.stringify(trip) }
//         });
//       }
      
//       router.push({
//         pathname: '/TripDetails/PlannedTrip',
//         params: { tripData: JSON.stringify(trip) }
//       });
//     };

//     return (
//       <View>
//         <View style={{ marginTop: 20 }}>
//           {imageUrl ? (
//             <Image source={{ uri: imageUrl }} style={styles.image} />
//           ) : (
//             <Image source={require('./../../assets/images/travel.jpg')} style={styles.image} />
//           )}
//           <View style={{marginTop:10}}>
//             <Text style={styles.paragraph}>
//               {latestTripData?.locationInfo?.name}
//             </Text>
//             <View style={styles.flexContainer}>
//               <Text style={styles.smallPara}>
//                 {moment(latestTripData.startDate).format("DD MMM YYYY")}
//               </Text>
//               <Text style={styles.smallPara}>
//                 🚌 {latestTripData.traveler.title}
//               </Text>
//             </View>
//             <TouchableOpacity 
//               style={styles.button}
//               onPress={() => handleTripPress(latestTrip)}
//             >
//               <Text style={styles.buttonText}>See Your Plan</Text>
//             </TouchableOpacity>
//           </View>
          
//           {userTrips?.slice(1).map((trip, index) => (
//     <TouchableOpacity 
//         key={index}
//         onPress={() => handleTripPress(trip)}
//     >
//         <UserTripCard trip={trip} />
//     </TouchableOpacity>
// ))}
//         </View>
//       </View>
//     );
// };

// const styles = StyleSheet.create({
//   image: {
//     width: '100%',
//     height: 240,
//     resizeMode: 'cover',
//     borderRadius: 15,
//   },
//   paragraph: {
//     fontFamily: 'poppins-medium',
//     fontSize: 20,
//   },
//   smallPara: {
//     fontFamily: 'poppins',
//     fontSize: 17,
//     color: Colors.GRAY
//   },
//   flexContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 5
//   },
//   button: {
//     padding: 15,
//     backgroundColor: Colors.PRIMARY,
//     borderRadius: 15,
//     marginTop: 15
//   },
//   buttonText: {
//     textAlign: 'center',
//     color: Colors.WHITE,
//     fontFamily: 'poppins-medium',
//     fontSize: 15
//   }
// });

// export default UserTripList;


// import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// import moment from 'moment'
// import { Colors } from './../../constants/Colors';
// import UserTripCard from './UserTripCard';
// import { useRouter } from 'expo-router';
// import PlannedTrip from '../../app/TripDetails/PlannedTrip';

// const getDestinationImage = (destination) => {
//   if (!destination) {
//     return { uri: 'https://source.unsplash.com/featured/?travel' };
//   }
//   return { uri: `https://source.unsplash.com/featured/?${encodeURIComponent(destination)}-tourism` };
// };


// const UserTripList = ({ userTrips }) => {
//     const router = useRouter();
    
//     if (!userTrips || userTrips.length === 0) {
//         return <Text>No trips found</Text>;
//     }
    
//     const latestTrip = userTrips[0];
    
//     // Add safety check for tripData parsing
//     let latestTripData;
//     try {
//         latestTripData = JSON.parse(latestTrip.tripData);
//     } catch (error) {
//         console.error('Error parsing trip data:', error);
//         return <Text>Error loading trip data</Text>;
//     }
    
//     const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
//     const photoRef = latestTripData?.locationInfo?.photoRef;

//     // const imageUrl = photoRef && apiKey 
//     //   ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
//     //   : null;

//     const placeName = latestTripData?.locationInfo?.name || "travel";

// let imageUrl = null;
// if (photoRef && apiKey) {
//   imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`;
// } else if (placeName) {
//   imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(placeName)},tourist,landmark`;
// }


//     const handleTripPress = (trip) => {
//       try {
//         const tripData = JSON.parse(trip.tripData);
        
//         if (tripData.flightInfo) {
//           router.push({
//             pathname: '/TripDetails/FlightInfo',
//             params: { tripData: JSON.stringify(trip) }
//           });
//         }
        
//         if (tripData.hotelInfo) {
//           router.push({
//             pathname: '/TripDetails/HotelList',
//             params: { tripData: JSON.stringify(trip) }
//           });
//         }
        
//         router.push({
//           pathname: '/TripDetails/PlannedTrip',
//           params: { tripData: JSON.stringify(trip) }
//         });
//       } catch (error) {
//         console.error('Error handling trip press:', error);
//       }
//     };

//     return (
//       <View>
//         <View style={{ marginTop: 20 }}>
//           {imageUrl ? (
//              <Image source={{ uri: imageUrl }} style={styles.image} />
//             // <Image source={{ uri: trip.tripImage }} style={styles.image} />

//           ) : (
//             // <Image source={require('./../../assets/images/travel.jpg')} style={styles.image} />
//            <Image
//   source={getDestinationImage(latestTripData?.locationInfo?.name)}
//   style={styles.image}
// />

//           )}
//           <View style={{marginTop:10}}>
//             <Text style={styles.paragraph}>
//               {latestTripData?.locationInfo?.name || 'Unknown Location'}
//             </Text>
//             <View style={styles.flexContainer}>
//               <Text style={styles.smallPara}>
//                 {latestTripData?.startDate ? moment(latestTripData.startDate).format("DD MMM YYYY") : 'No Date'}
//               </Text>
//               <Text style={styles.smallPara}>
//                 🚌 {latestTripData?.traveler?.title || 'Solo'}
//               </Text>
//             </View>
//             <TouchableOpacity 
//               style={styles.button}
//               onPress={() => handleTripPress(latestTrip)}
//             >
//               <Text style={styles.buttonText}>See Your Plan</Text>
//             </TouchableOpacity>
//           </View>
          
//           {userTrips?.slice(1).map((trip, index) => (
//             <TouchableOpacity 
//                 key={index}
//                 onPress={() => handleTripPress(trip)}
//             >
//                 <UserTripCard trip={trip} />
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
//     );
// };

// const styles = StyleSheet.create({
//   image: {
//     width: '100%',
//     height: 240,
//     resizeMode: 'cover',
//     borderRadius: 15,
//   },
//   paragraph: {
//     fontFamily: 'poppins-medium',
//     fontSize: 20,
//   },
//   smallPara: {
//     fontFamily: 'poppins',
//     fontSize: 17,
//     color: Colors.GRAY
//   },
//   flexContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 5
//   },
//   button: {
//     padding: 15,
//     backgroundColor: Colors.PRIMARY,
//     borderRadius: 15,
//     marginTop: 15
//   },
//   buttonText: {
//     textAlign: 'center',
//     color: Colors.WHITE,
//     fontFamily: 'poppins-medium',
//     fontSize: 15
//   }
// });

// export default UserTripList;


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
      const tripData = JSON.parse(trip.tripData);
      router.push({
        pathname: '/TripDetails/PlannedTrip',
        params: { tripData: JSON.stringify(trip) },
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

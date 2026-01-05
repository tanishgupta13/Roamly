// import { StyleSheet, Text, View, Image } from 'react-native';
// import moment from 'moment';
// import { Colors } from './../../constants/Colors';

// const getDestinationImage = (destination) => {
//   if (!destination) {
//     return { uri: "https://source.unsplash.com/600x400/?travel" };
//   }

//   const lower = destination.toLowerCase();

//   if (lower.includes("goa"))
//     return { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Baga_Beach_Goa.jpg" };

//   if (lower.includes("paris"))
//     return { uri: "https://upload.wikimedia.org/wikipedia/commons/a/af/Tour_Eiffel_Wikimedia_Commons.jpg" };

//   if (lower.includes("bali"))
//     return { uri: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Tanah_Lot_Bali_Indonesia.JPG" };

//   if (lower.includes("dubai"))
//     return { uri: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Burj_Khalifa_Dubai.jpg" };

//   if (lower.includes("london"))
//     return { uri: "https://upload.wikimedia.org/wikipedia/commons/d/d6/London_Eye_Twilight_April_2006.jpg" };

//   // fallback random from Unsplash
//   return { uri: `https://source.unsplash.com/600x400/?${encodeURIComponent(destination)},tourist-attraction` };
// };


// const UserTripCard = ({ trip }) => {
//   const tripData = JSON.parse(trip?.tripData);
//   const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
//   const photoRef = tripData?.locationInfo?.photoRef;
  
//   // const imageUrl = photoRef && apiKey 
//   //   ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
//   //   : null;
// const placeName = tripData?.locationInfo?.name || "travel";

// // Try Google Places photoRef, else fallback to Unsplash
// let imageUrl = null;

// if (photoRef && apiKey) {
//   imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`;
// } else if (placeName) {
//   // Fallback to Unsplash tourist attraction image
//   imageUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(placeName)},tourist,landmark`;
// }

//   return (
//     <View style={styles.flexContainer}>
//       {imageUrl ? (
//         <Image 
//           source={{ uri: imageUrl }} 
//           style={styles.image} 
//         />
//       ) : (
//         // <Image 
//         //   source={require('./../../assets/images/travel.jpg')} 
//         //   style={styles.image} 
//         // />
//         <Image 
//   source={getDestinationImage(tripData?.locationInfo?.name)} 
//   style={styles.image} 
// />

//       )}
//       <View style={{marginLeft:10}}>
//         <Text style={styles.paragraph}>
//           {tripData?.locationInfo?.name}
//         </Text>
//         <Text style={styles.smallPara}>
//           {moment(tripData?.startDate).format("DD MMM YYYY")}
//         </Text>
//         <Text style={styles.smallPara}>
//           Travelling: {tripData?.traveler?.title}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   image: {
//     width: 100,
//     height: 100,
//     borderRadius: 15,
//   },
//   flexContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   paragraph: {
//     fontFamily: 'poppins-medium',
//     fontSize: 18,
//   },
//   smallPara: {
//     fontFamily: 'poppins',
//     fontSize: 14,
//     color: Colors.GRAY,
//   },
// });

// export default UserTripCard;



import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from './../../constants/Colors';
import { useEffect, useState } from 'react';
import moment from 'moment';

const UserTripCard = ({ trip }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  let tripData;
  try {
    tripData = JSON.parse(trip.tripData);
  } catch (error) {
    console.error('Error parsing trip data in UserTripCard:', error);
    return null;
  }

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
  const unsplashKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  const photoRef = tripData?.locationInfo?.photoRef;

  const googleImageUrl =
    photoRef && apiKey
      ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
      : null;

  useEffect(() => {
    const fetchUnsplashImage = async () => {
      try {
        const locationName = tripData?.locationInfo?.name || 'travel';
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            locationName
          )}&client_id=${unsplashKey}`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setImageUrl(data.results[0].urls.regular);
        }
      } catch (err) {
        console.error('Error fetching Unsplash image:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!googleImageUrl) fetchUnsplashImage();
    else {
      setImageUrl(googleImageUrl);
      setLoading(false);
    }
  }, [tripData]);

  return (
    <View style={styles.card}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ height: 180 }} />
      ) : (
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : require('./../../assets/images/travel.jpg')
          }
          style={styles.image}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{tripData?.locationInfo?.name || 'Unknown'}</Text>
        <Text style={styles.date}>
          {tripData?.startDate
            ? moment(tripData.startDate).format('DD MMM YYYY')
            : 'No Date'}
        </Text>
        <Text style={styles.traveler}>
          🧳 {tripData?.traveler?.title || 'Solo'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    marginVertical: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  content: {
    padding: 10,
  },
  title: {
    fontFamily: 'poppins-medium',
    fontSize: 18,
  },
  date: {
    fontFamily: 'poppins',
    fontSize: 15,
    color: Colors.GRAY,
  },
  traveler: {
    fontFamily: 'poppins',
    fontSize: 15,
    color: Colors.PRIMARY,
    marginTop: 5,
  },
});

export default UserTripCard;

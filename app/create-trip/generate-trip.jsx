// import { StyleSheet, Text, View, Image } from 'react-native';
// import { useEffect, useContext, useState } from 'react';
// import { useNavigation, useRouter } from 'expo-router';
// import { CreateTripContext } from '../../context/CreateTripContext';
// import { Colors } from './../../constants/Colors';
// import { AI_PROMPT } from './../../constants/data';
// import { chatSession } from './../../config/AiModel';
// import { auth, db } from './../../config/FirebaseConfig';
// import { setDoc, doc } from 'firebase/firestore'; // Correct Firebase import

// const GenerateTrip = () => {
//   const user = auth.currentUser;
//   const { tripData } = useContext(CreateTripContext);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     generateAiTrip();
//   }, []);

//   const generateAiTrip = async () => {
//     try {
//       setLoading(true);
//       const FINAL_PROMPT = AI_PROMPT.replace('{location}', tripData?.locationInfo?.name)
//         .replace('{totalDay}', tripData?.totalNumOfDays)
//         .replace('{totalNight}', tripData?.totalNumOfDays - 1)
//         .replace('{traveler}', tripData?.traveler?.title)
//         .replace('{budget}', tripData?.budget)
//         .replace('{totalDay}', tripData?.totalNumOfDays)
//         .replace('{totalNight}', tripData?.totalNumOfDays - 1)

//       console.log('FINAL_PROMPT', FINAL_PROMPT);
//       const result = await chatSession.sendMessage(FINAL_PROMPT);

//       // Assuming the response text is a JSON string
//       const tripResponse = JSON.parse(result.response.text());
//       console.log(tripResponse);
//       setLoading(false);

//       // Save generating trip data to Firebase
//       const docId = Date.now().toString();
//       await setDoc(doc(db, 'UserTrip', docId), {
//         userEmail: user.email,
//         tripPlan: tripResponse, // AI Generate Result
//         tripData: JSON.stringify(tripData), // User Selection data
//         docId: docId,
//       });

//       router.push('/MyTrip');
//     } catch (error) {
//       console.error('Error generating trip:', error);
//       setLoading(false);
//     }
//   };

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
//     const router = useRouter();
    
//     useEffect(() => {
//         // Listen for auth state changes
//         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//             setUser(currentUser);
//             if (currentUser && tripData && tripData.traveler && tripData.locationInfo) {
//                 GenerateAITrip();
//             } else if (!currentUser) {
//                 console.error('User not authenticated');
//                 Alert.alert('Authentication Error', 'Please log in to generate trips');
//                 router.replace('/Login');
//                 router.push('/auth/sign-in');
//                 router.push('../components/Login');
                
//             } else if (currentUser && (!tripData || !tripData.traveler || !tripData.locationInfo)) {
//                 console.error('Trip data incomplete');
//                 Alert.alert('Error', 'Trip data is incomplete. Please go back and fill all details.');
//                 router.back();
//             }
//         });

//         return () => unsubscribe();
//     }, [tripData]);

//     const cleanJsonString = (text) => {
//         try {
//             // Remove markdown code blocks
//             let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
//             // Find JSON object boundaries
//             const start = cleaned.indexOf('{');
//             const end = cleaned.lastIndexOf('}');
            
//             if (start === -1 || end === -1 || start >= end) {
//                 throw new Error('No valid JSON object found');
//             }
            
//             cleaned = cleaned.substring(start, end + 1);
            
//             // Remove any remaining non-JSON characters at the beginning/end
//             cleaned = cleaned.trim();
            
//             // Test if it's valid JSON
//             JSON.parse(cleaned);
//             return cleaned;
//         } catch (error) {
//             console.error('JSON cleaning failed:', error);
//             throw new Error('Failed to extract valid JSON from response');
//         }
//     };

//     const GenerateAITrip = async () => {
//         try {
//             setLoading(true);
            
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
            
//             // Check if response exists and has proper structure
//             if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
//                 throw new Error('Invalid AI response structure');
//             }

//             const responseText = result.response.candidates[0].content.parts[0].text;
//             console.log('Raw AI response:', responseText);

//             // Clean and parse JSON
//             const cleanedJson = cleanJsonString(responseText);
//             console.log('Cleaned JSON:', cleanedJson);
            
//             const parsedTripData = JSON.parse(cleanedJson);
//             console.log('Parsed trip data:', parsedTripData);

//             // Save to Firestore
//             const docId = Date.now().toString();
//             await setDoc(doc(db, "UserTrips", docId), {
//                 userEmail: user.email,
//                 tripPlan: parsedTripData,
//                 tripData: JSON.stringify(tripData),
//                 docId: docId,
//                 createdAt: new Date().toISOString()
//             });

//             console.log('Trip saved successfully');
//             router.push('/(tabs)/mytrip');
            
//         } catch (error) {
//             console.error('Error generating trip:', error);
//             Alert.alert(
//                 'Error', 
//                 `Failed to generate trip: ${error.message}`
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (!user) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.title}>Authenticating...</Text>
//                 <Text style={styles.paragraph}>Please wait while we verify your account</Text>
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
import { AI_PROMPT } from '@/constants/data';
import { chatSession } from '@/configs/AiModel';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/configs/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function GenerateTrip() {
    const { tripData, setTripData } = useContext(CreateTripContext);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
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
        if (!authLoading) {
            if (!user) {
                console.log('User not authenticated, redirecting...');
                Alert.alert('Authentication Error', 'Please log in to generate trips');
                router.replace('/');
                return;
            }

            if (!tripData || !tripData.traveler || !tripData.locationInfo) {
                console.log('Trip data incomplete');
                Alert.alert('Error', 'Trip data is incomplete. Please go back and fill all details.');
                router.back();
                return;
            }

            // Generate trip when both user and data are ready
            if (user && tripData && tripData.traveler && tripData.locationInfo && !loading && !hasGenerated) {
                GenerateAITrip();
            }
        }
    }, [user, authLoading, tripData]);

    const cleanJsonString = (text) => {
        try {
            let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            
            if (start === -1 || end === -1 || start >= end) {
                throw new Error('No valid JSON object found');
            }
            
            cleaned = cleaned.substring(start, end + 1).trim();
            JSON.parse(cleaned);
            return cleaned;
        } catch (error) {
            console.error('JSON cleaning failed:', error);
            throw new Error('Failed to extract valid JSON from response');
        }
    };

    const GenerateAITrip = async () => {
        if (hasGenerated) return; // Prevent multiple calls
        
        try {
            setLoading(true);
            setHasGenerated(true);
            
            if (!user || !user.email) {
                throw new Error('User not authenticated');
            }

            if (!tripData) {
                throw new Error('Trip data is missing');
            }

            const FINAL_PROMPT = AI_PROMPT
                .replace('{location}', tripData?.locationInfo?.name || 'Unknown')
                .replace('{totalDay}', String(tripData?.totalNumOfDays || 1))
                .replace('{totalNight}', String((tripData?.totalNumOfDays - 1) || 0))
                .replace('{traveler}', tripData?.traveler?.title || 'Solo')
                .replace('{budget}', tripData?.budget || 'Moderate');

            console.log('Sending prompt to AI...');
            const result = await chatSession.sendMessage(FINAL_PROMPT);
            
            if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid AI response structure');
            }

            const responseText = result.response.candidates[0].content.parts[0].text;
            console.log('Raw AI response:', responseText);

            const cleanedJson = cleanJsonString(responseText);
            console.log('Cleaned JSON:', cleanedJson);
            
            // const parsedTripData = JSON.parse(cleanedJson);
            // console.log('Parsed trip data:', parsedTripData);

            // const docId = Date.now().toString();
            // await setDoc(doc(db, "UserTrips", docId), {
            //     userEmail: user.email,
            //     tripPlan: parsedTripData,
            //     tripData: JSON.stringify(tripData),
            //     docId: docId,
            //     createdAt: new Date().toISOString()
            // });
            const parsedTripData = JSON.parse(cleanedJson);
console.log('Parsed trip data:', parsedTripData);

// Try to find a meaningful image for the trip
let tripImage = null;

// 1️⃣ First preference: from AI response (placesToVisit or hotel images)
tripImage =
  parsedTripData?.placesToVisit?.[0]?.placeImageUrl ||
  parsedTripData?.hotelOptions?.[0]?.hotelImageUrl;

// 2️⃣ If AI returned a dummy URL like example.com, ignore it
if (tripImage && tripImage.includes('example.com')) {
  tripImage = null;
}

// 3️⃣ Fallback: Unsplash based on the location
if (!tripImage) {
  const locationName = tripData?.locationInfo?.name || 'travel';
  tripImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(locationName)},tourist,landmark`;
}

console.log('Selected Trip Image:', tripImage);

// Now save to Firestore
const docId = Date.now().toString();
await setDoc(doc(db, "UserTrips", docId), {
  userEmail: user.email,
  tripPlan: parsedTripData,
  tripData: JSON.stringify(tripData),
  tripImage: tripImage,          // 🆕 Store it here
  docId: docId,
  createdAt: new Date().toISOString()
});


            console.log('Trip saved successfully');
            router.push('/(tabs)/mytrip');
            
        } catch (error) {
            console.error('Error generating trip:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            Alert.alert(
                'Error', 
                `Failed to generate trip: ${errorMessage}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (errorMessage.includes('authenticated')) {
                                router.replace('/');
                            } else {
                                router.back();
                            }
                        }
                    }
                ]
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
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: 85,
        padding: 25,
        height: '100%'
    },
    title: {
        fontFamily: 'poppins-semi',
        fontSize: 30,
        textAlign: 'center',
        marginTop: 10,
    },
    paragraph: {
        fontFamily: 'poppins-medium',
        fontSize: 20,
        textAlign: 'center',
        marginTop: 20,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 200,
        objectFit: 'contain'
    },
    paragraphGray: {
        fontFamily: 'poppins',
        fontSize: 20,
        color: Colors.GRAY,
        textAlign: 'center',
    },
});
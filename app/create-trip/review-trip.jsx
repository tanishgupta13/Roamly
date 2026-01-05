// import { StyleSheet, Text, View,TouchableOpacity } from 'react-native'
// import { useNavigation,useRouter} from 'expo-router';
// import { useEffect,useState,useContext } from "react";
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { Entypo } from '@expo/vector-icons';
// import { CreateTripContext } from '../../context/CreateTripContext';
// import { Colors } from './../../constants/Colors';
// import moment from 'moment'

// const ReviewTrip = () => {
//     const navigation = useNavigation();
//     const router = useRouter();


//     const { tripData, setTripData } = useContext(CreateTripContext);


//     useEffect(() => {
//         navigation.setOptions({
//           headerShown: true,
//           headerTransparent: true,
//           headerTitle: '',
//         });
//       }, [navigation]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Review Your Trip</Text>

//       <View style={{marginTop:20}}>
//         <Text style={{fontFamily:'poppins-semi',fontSize:20}}>Please review your selection before generating your trip.</Text>
        
//         {/* Destination View */}
//         <View style={[styles.flex, { marginTop: 20 }]}>
//             <Text style={styles.icon}>📍</Text>
//             <View>
//                 <Text style={{fontFamily:'poppins',fontSize:20,color:Colors.GRAY}}>Destination</Text>
//                 <Text style={{fontFamily:'poppins-medium',fontSize:20}}>{tripData?.locationInfo?.name}</Text>
//             </View>
//         </View>

//          {/* Calender travel Date View */}
//          <View style={styles.flex}>
//             <Text style={styles.icon}>📅</Text>
//             <View>
//                 <Text style={{fontFamily:'poppins',fontSize:20,color:Colors.GRAY}}>travel Date </Text>
//                 <Text style={{fontFamily: 'poppins-medium', fontSize: 20}}>
//                     {moment(tripData?.startDate).format('DD MMM') + " TO " +
//                     moment(tripData?.endDate).format('DD MMM') + " (" + tripData?.totalNumOfDays + " Days)"}
//                 </Text>

//             </View>
//         </View>

//         {/* Count travel  View */}
//         <View style={styles.flex}>
//             <Text style={styles.icon}>🚌</Text>
//             <View>
//                 <Text style={{fontFamily:'poppins',fontSize:20,color:Colors.GRAY}}>Who is traveling </Text>
//                 <Text style={{fontFamily: 'poppins-medium', fontSize: 20}}>{tripData?.traveler?.title}</Text>

//             </View>
//         </View>

//           {/* Budget travel  View */}
//           <View style={styles.flex}>
//             <Text style={styles.icon}>💰</Text>
//             <View>
//                 <Text style={{fontFamily:'poppins',fontSize:20,color:Colors.GRAY}}>Budget</Text>
//                 <Text style={{fontFamily: 'poppins-medium', fontSize: 20}}>{tripData?.budget}</Text>

//             </View>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.button}
//       onPress={()=>router.replace('/create-trip/generate-trip')} 
//       >
//             <Text style={{color:Colors.WHITE,textAlign:'center',fontFamily: 'poppins-medium',fontSize:20}}>Build My Trip</Text>
//       </TouchableOpacity>
//     </View>
//   )
// }

// export default ReviewTrip

// const styles = StyleSheet.create({
//     container: {
//         backgroundColor: Colors.WHITE,
//         paddingTop: 85,
//         padding: 25,
//         height: '100%',
//       },
//       icon:{
//           fontSize:25,
//           justifyContent:'center',
//           textAlign:'justify'
//       },
//     title: {
//         fontFamily: 'poppins-semi',
//         fontSize: 30,
//         textAlign: 'center',
//         marginTop: 10,
//       },
//     flex:{
//         display:'flex',
//         flexDirection:'row',
//         gap:20,
//         marginTop:40
//     },
//     button: {
//         backgroundColor:Colors.PRIMARY,
//         padding: 15,
//         borderRadius:15,
//         marginTop:80,
//         padding:15
//     },
// })
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState, useContext } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Entypo } from '@expo/vector-icons';
import { CreateTripContext } from '../../context/CreateTripContext';
import { Colors } from './../../constants/Colors';
import moment from 'moment'

const ReviewTrip = () => {
    const navigation = useNavigation();
    const router = useRouter();

    const { tripData, setTripData } = useContext(CreateTripContext);

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Review Your Trip</Text>

                    <View style={styles.contentWrapper}>
                        <Text style={styles.subtitle}>
                            Please review your selection before generating your trip.
                        </Text>
                        
                        {/* Destination View */}
                        <View style={styles.reviewCard}>
                            <View style={styles.flex}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>📍</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.label}>Destination</Text>
                                    <Text style={styles.value}>{tripData?.locationInfo?.name}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Calendar travel Date View */}
                        <View style={styles.reviewCard}>
                            <View style={styles.flex}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>📅</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.label}>Travel Date</Text>
                                    <Text style={styles.value}>
                                        {moment(tripData?.startDate).format('DD MMM') + " TO " +
                                        moment(tripData?.endDate).format('DD MMM') + " (" + tripData?.totalNumOfDays + " Days)"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Count travel View */}
                        <View style={styles.reviewCard}>
                            <View style={styles.flex}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>🚌</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.label}>Who is traveling</Text>
                                    <Text style={styles.value}>{tripData?.traveler?.title}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Budget travel View */}
                        <View style={styles.reviewCard}>
                            <View style={styles.flex}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>💰</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.label}>Budget</Text>
                                    <Text style={styles.value}>{tripData?.budget}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
            
            {/* Fixed Button at Bottom */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => router.replace('/create-trip/generate-trip')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Build My Trip</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default ReviewTrip

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Space for fixed button
    },
    container: {
        paddingTop: 85,
        paddingHorizontal: 25,
        minHeight: '100%',
    },
    title: {
        fontFamily: 'poppins-semi',
        fontSize: 28,
        textAlign: 'center',
        marginTop: 10,
        color: '#1a1a1a',
        marginBottom: 10,
    },
    contentWrapper: {
        marginTop: 20,
    },
    subtitle: {
        fontFamily: 'poppins',
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    reviewCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    flex: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
        paddingTop: 2,
    },
    label: {
        fontFamily: 'poppins',
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontFamily: 'poppins-medium',
        fontSize: 18,
        color: '#1a1a1a',
        lineHeight: 24,
        flexWrap: 'wrap',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 25,
        paddingTop: 15,
        paddingBottom: 25,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    button: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 18,
        paddingHorizontal: 30,
        borderRadius: 16,
        shadowColor: Colors.PRIMARY,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: Colors.WHITE,
        textAlign: 'center',
        fontFamily: 'poppins-medium',
        fontSize: 18,
        letterSpacing: 0.5,
    },
})
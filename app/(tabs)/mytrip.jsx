import { View, Text, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from '@/constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';
import StartNewTripCard from '@/components/MyTrips/StartNewTripCard';
import { db, auth } from '@/configs/FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import UserTripList from '@/components/MyTrips/UserTripList';
import { useRouter } from 'expo-router';

export default function MyTrip() {
  const [futureTrips, setFutureTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [showPastTrips, setShowPastTrips] = useState(false); // Controls the dropdown
  const [loading, setLoading] = useState(false);
  
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    if (user) {
      GetMyTrips();
    }
  }, [user]);

  const GetMyTrips = async () => {
    try {
      setLoading(true);
      
      const q = query(collection(db, 'UserTrips'), where('userEmail', '==', user?.email));
      const querySnapshot = await getDocs(q);
      
      const upcoming = [];
      const past = [];
      
      // Get today's date and set the time to midnight so we strictly compare days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const trip = { id: doc.id, ...data };
        
        // IMPORTANT: Adjust 'startDate' here to match exactly what you named the date field in your Firestore database!
        // It might be data.startDate, data.tripData.startDate, etc.
        const tripDateString = data?.startDate || data?.tripData?.startDate; 

        if (tripDateString) {
          const tripDate = new Date(tripDateString);
          
          if (tripDate < today) {
            past.push(trip); // It happened before today
          } else {
            upcoming.push(trip); // It happens today or in the future
          }
        } else {
          // If a trip has no date saved for some reason, default to showing it in upcoming
          upcoming.push(trip);
        }
      });

      setFutureTrips(upcoming);
      setPastTrips(past);

    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={{ fontFamily: 'poppins-semi', fontSize: 35 }}>My Trips</Text>
        <TouchableOpacity onPress={() => router.push('/create-trip/search-place')}>
          <Ionicons name="add-circle" size={50} color="black" />
        </TouchableOpacity>
      </View>

      {/* TRIP LISTS */}
      <ScrollView 
        style={{ flex: 1, marginTop: 75 }}
        contentContainerStyle={{ padding: 25, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size={'large'} color={Colors.PRIMARY} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* If the user has absolutely ZERO trips overall */}
            {futureTrips.length === 0 && pastTrips.length === 0 ? (
              <StartNewTripCard />
            ) : (
              <>
                {/* 1. UPCOMING TRIPS SECTION */}
                {futureTrips.length > 0 ? (
                  <UserTripList userTrips={futureTrips} />
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>No upcoming trips planned.</Text>
                  </View>
                )}

                {/* 2. PAST TRIPS SECTION (Only shows if they actually have past trips) */}
                {pastTrips.length > 0 && (
                  <View style={{ marginTop: 40 }}>
                    {/* Toggle Button */}
                    <TouchableOpacity 
                      style={styles.toggleButton} 
                      onPress={() => setShowPastTrips(!showPastTrips)}
                    >
                      <Text style={styles.toggleButtonText}>Previous Trips</Text>
                      <Ionicons 
                        name={showPastTrips ? "chevron-up" : "chevron-down"} 
                        size={24} 
                        color={Colors.GRAY} 
                      />
                    </TouchableOpacity>

                    {/* Hidden List that expands when clicked */}
                    {showPastTrips && (
                      <View style={{ marginTop: 15 }}>
                        <UserTripList userTrips={pastTrips} />
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 25,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 15,
  },
  toggleButtonText: {
    fontFamily: 'poppins-semi',
    fontSize: 18,
    color: Colors.GRAY
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10
  },
  emptyStateText: {
    fontFamily: 'poppins',
    color: Colors.GRAY,
    fontSize: 16
  }
});
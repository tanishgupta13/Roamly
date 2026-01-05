import { View, Text, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors } from '@/constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';
import StartNewTripCard from '@/components/MyTrips/StartNewTripCard';
import { db, auth } from '@/configs/FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import UserTripList from '@/components/MyTrips/UserTripList';
import { useRouter } from 'expo-router';

export default function MyTrip() {
  const [userTrips, setUserTrips] = useState([]);
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
      setUserTrips([]);
      const q = query(collection(db, 'UserTrips'), where('userEmail', '==', user?.email));
      const querySnapshot = await getDocs(q);
      const trips = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() });
      });
      setUserTrips(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 25,
        paddingTop: 15,
        // paddingBottom: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Text style={{
          fontFamily: 'poppins-semi',
          fontSize: 35
        }}>My Trips</Text>
        <TouchableOpacity onPress={() => router.push('/create-trip/search-place')}>
          <Ionicons name="add-circle" size={50} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ 
          flex: 1,
          marginTop: 110
        }}
        contentContainerStyle={{
          padding: 25,
          paddingBottom: 100
        }}
      >
        {loading ? (
          <ActivityIndicator size={'large'} color={Colors.PRIMARY} />
        ) : (
          <>
            {userTrips.length === 0 ? (
              <StartNewTripCard />
            ) : (
              <UserTripList userTrips={userTrips} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
import { View, Text, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Alert, Animated, RefreshControl } from 'react-native'
import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Colors } from '@/constants/Colors'
import Ionicons from '@expo/vector-icons/Ionicons';
import StartNewTripCard from '@/components/MyTrips/StartNewTripCard';
import { db, auth } from '@/configs/FirebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import UserTripList from '@/components/MyTrips/UserTripList';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CreateTripContext } from '@/context/CreateTripContext';

export default function MyTrip() {
  const [futureTrips, setFutureTrips]     = useState([]);
  const [pastTrips,   setPastTrips]       = useState([]);
  const [showPastTrips, setShowPastTrips] = useState(false);
  const [loading,     setLoading]         = useState(false);
  const [refreshing,  setRefreshing]      = useState(false);
  const [totalDays,   setTotalDays]       = useState(0);

  const { setTripData } = useContext(CreateTripContext);
  const user   = auth.currentUser;
  const router = useRouter();

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const pastAnim   = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (user) GetMyTrips();
    }, [user])
  );

  const GetMyTrips = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const q = query(collection(db, 'UserTrips'), where('userEmail', '==', user?.email));
      const querySnapshot = await getDocs(q);

      const upcoming = [];
      const past     = [];
      let days       = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      querySnapshot.forEach((document) => {
        const data = document.data();
        const trip = { id: document.id, ...data };

        let tripDateString = data?.startDate;
        if (!tripDateString) {
          try {
            const parsed = JSON.parse(data.tripData);
            tripDateString = parsed?.startDate || parsed?.tripData?.startDate;
          } catch {}
        }

        if (tripDateString) {
          const tripDate = new Date(tripDateString);
          tripDate.setHours(0, 0, 0, 0);
          if (tripDate < today) past.push(trip);
          else upcoming.push(trip);
        } else {
          upcoming.push(trip);
        }

        try {
          const parsed = JSON.parse(data.tripData);
          const d = parseInt(parsed?.totalDays || parsed?.noOfDays || 0);
          if (!isNaN(d)) days += d;
        } catch {}
      });

      upcoming.sort((a, b) => {
        const da  = new Date(a?.startDate || 0);
        const db_ = new Date(b?.startDate || 0);
        return da - db_;
      });

      past.sort((a, b) => {
        const da  = new Date(a?.startDate || 0);
        const db_ = new Date(b?.startDate || 0);
        return db_ - da;
      });

      setFutureTrips(upcoming);
      setPastTrips(past);
      setTotalDays(days);

      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();

    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteTrip = (tripId, tripName) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${tripName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'UserTrips', tripId));
              setFutureTrips(prev => prev.filter(t => t.id !== tripId));
              setPastTrips(prev => prev.filter(t => t.id !== tripId));
            } catch {
              Alert.alert('Error', 'Could not delete trip. Please try again.');
            }
          },
        },
      ]
    );
  };

  const togglePastTrips = () => {
    const toValue = showPastTrips ? 0 : 1;
    setShowPastTrips(!showPastTrips);
    Animated.timing(pastAnim, { toValue, duration: 300, useNativeDriver: true }).start();
  };

  // ── KEY FIX: reset trip context before opening search ────────────────────
  const handleNewTrip = () => {
    setTripData({});
    router.push('/create-trip/search-place');
  };

  const totalTrips = futureTrips.length + pastTrips.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F6FB' }}>

      <LinearGradient
        colors={['#0D1F1B', '#1A6B5A', '#2D9B7B']}
        start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.heroSub}>Your Journey</Text>
            <Text style={styles.heroTitle}>My Trips</Text>
          </View>
          {/* FIX: use handleNewTrip instead of direct router.push */}
          <TouchableOpacity style={styles.addBtn} onPress={handleNewTrip}>
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {totalTrips > 0 && (
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalTrips}</Text>
              <Text style={styles.statLbl}>Total Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{futureTrips.length}</Text>
              <Text style={styles.statLbl}>Upcoming</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalDays}</Text>
              <Text style={styles.statLbl}>Days Planned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{pastTrips.length}</Text>
              <Text style={styles.statLbl}>Completed</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => GetMyTrips(true)}
            colors={['#1A6B5A']}
            tintColor="#1A6B5A"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1A6B5A" />
            <Text style={styles.loadingText}>Loading your adventures...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {totalTrips === 0 ? (
              <StartNewTripCard />
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLeft}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                  </View>
                  {futureTrips.length > 0 && (
                    <View style={styles.countPill}>
                      <Text style={styles.countPillText}>{futureTrips.length}</Text>
                    </View>
                  )}
                </View>

                {futureTrips.length > 0 ? (
                  <UserTripList userTrips={futureTrips} onDelete={handleDeleteTrip} />
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={{ fontSize: 36 }}>🗺️</Text>
                    <Text style={styles.emptyTitle}>No upcoming trips</Text>
                    <Text style={styles.emptySub}>Start planning your next adventure!</Text>
                    <TouchableOpacity style={styles.planBtn} onPress={handleNewTrip}>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={styles.planBtnText}>Plan a Trip</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {pastTrips.length > 0 && (
                  <View style={{ marginTop: 28 }}>
                    <TouchableOpacity style={styles.pastToggle} onPress={togglePastTrips} activeOpacity={0.8}>
                      <View style={styles.sectionLeft}>
                        <View style={[styles.sectionDot, { backgroundColor: '#9CA3AF' }]} />
                        <Text style={styles.sectionTitle}>Previous Trips</Text>
                      </View>
                      <View style={styles.pastToggleRight}>
                        <View style={[styles.countPill, { backgroundColor: '#E5E7EB' }]}>
                          <Text style={[styles.countPillText, { color: '#6B7280' }]}>{pastTrips.length}</Text>
                        </View>
                        <Animated.View style={{
                          transform: [{
                            rotate: pastAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
                          }]
                        }}>
                          <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </Animated.View>
                      </View>
                    </TouchableOpacity>

                    {showPastTrips && (
                      <View style={{ marginTop: 12 }}>
                        <UserTripList userTrips={pastTrips} onDelete={handleDeleteTrip} isPast />
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 14, paddingBottom: 20, paddingHorizontal: 22,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroSub:   { fontFamily: 'poppins', fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroTitle: { fontFamily: 'poppins-semi', fontSize: 28, color: '#fff', marginTop: -2 },
  addBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  statsStrip: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statNum:     { fontFamily: 'poppins-semi', fontSize: 18, color: '#fff' },
  statLbl:     { fontFamily: 'poppins', fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 14 },
  loadingText: { fontFamily: 'poppins', fontSize: 14, color: '#9CA3AF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 6 },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A6B5A' },
  sectionTitle: { fontFamily: 'poppins-semi', fontSize: 17, color: '#1a1a2e' },
  countPill:    { backgroundColor: '#1A6B5A' + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countPillText:{ fontFamily: 'poppins-semi', fontSize: 12, color: '#1A6B5A' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  emptyTitle: { fontFamily: 'poppins-semi', fontSize: 16, color: '#1a1a2e', marginTop: 4 },
  emptySub:   { fontFamily: 'poppins', fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  planBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A6B5A', paddingHorizontal: 20,
    paddingVertical: 11, borderRadius: 14, marginTop: 8,
  },
  planBtnText: { fontFamily: 'poppins-semi', fontSize: 14, color: '#fff' },
  pastToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  pastToggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
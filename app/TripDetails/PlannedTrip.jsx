import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import moment from 'moment';

const ActivityCard = ({ activity, timePeriod }) => {
  const getTimeIcon = (period) => {
    switch(period) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      default: return '⭐';
    }
  };

  const openLocation = () => {
    if (activity.geoCoordinates) {
      const url = `https://maps.google.com/?q=${activity.geoCoordinates}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeIcon}>{getTimeIcon(timePeriod)}</Text>
          <Text style={styles.timePeriodTitle}>
            {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
          </Text>
        </View>
        {activity.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {activity.rating}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.activityTitle}>{activity.activity || 'Activity'}</Text>
      
      {activity.details && (
        <Text style={styles.activityDetails}>{activity.details}</Text>
      )}
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>🕒 Travel Time</Text>
          <Text style={styles.infoValue}>{activity.travelTime || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>💰 Pricing</Text>
          <Text style={styles.infoValue}>{activity.ticketPricing || 'Free'}</Text>
        </View>
      </View>

      {activity.geoCoordinates && (
        <TouchableOpacity style={styles.locationButton} onPress={openLocation}>
          <Text style={styles.locationButtonText}>📍 View on Map</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function PlannedTripPage() {
  const { tripData } = useLocalSearchParams();
  const router = useRouter();
  
  let parsedTripData;
  try {
    parsedTripData = JSON.parse(tripData);
  } catch (error) {
    console.error('Error parsing trip data:', error);
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.errorText}>Error loading trip data</Text>
      </ScrollView>
    );
  }

  const itinerary = parsedTripData?.tripPlan?.itinerary;
  const locationInfo = JSON.parse(parsedTripData.tripData)?.locationInfo;
  const tripDetails = JSON.parse(parsedTripData.tripData);
  
  if (!itinerary) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🏕️ Plan Details</Text>
        <Text style={styles.errorText}>No itinerary found</Text>
      </ScrollView>
    );
  }

  // Generate image URL
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API_KEY;
  const photoRef = locationInfo?.photoRef;
  const imageUrl = photoRef && apiKey 
    ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photoRef}&key=${apiKey}`
    : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.headerImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🏖️</Text>
          </View>
        )}
        <View style={styles.headerOverlay}>
          <Text style={styles.destinationName}>{locationInfo?.name || 'Your Trip'}</Text>
          <Text style={styles.tripMeta}>
            📅 {tripDetails?.startDate ? moment(tripDetails.startDate).format("DD MMM YYYY") : 'Date TBD'} • 
            👥 {tripDetails?.traveler?.title || 'Solo'}
          </Text>
        </View>
      </View>

      {/* Trip Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>🗓️ Trip Overview</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{parsedTripData.tripPlan?.duration || '1 Day'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryValue}>{parsedTripData.tripPlan?.budget || 'Moderate'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best Time</Text>
            <Text style={styles.summaryValue}>{parsedTripData.tripPlan?.bestTimeToVisit || 'Year Round'}</Text>
          </View>
        </View>
      </View>

      {/* Itinerary Section */}
      <View style={styles.itineraryContainer}>
        <Text style={styles.sectionTitle}>🏕️ Daily Itinerary</Text>
        
        {Object.entries(itinerary).map(([day, dayData], dayIndex) => (
          <View key={dayIndex} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                Day {dayIndex + 1}
              </Text>
              {dayData.theme && (
                <View style={styles.themeContainer}>
                  <Text style={styles.themeText}>🎯 {dayData.theme}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.activitiesContainer}>
              {Object.entries(dayData).map(([timePeriod, activity], timeIndex) => {
                if (timePeriod === 'theme') return null;
                
                return (
                  <ActivityCard 
                    key={timeIndex} 
                    activity={activity} 
                    timePeriod={timePeriod}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
  
  // Header Styles
  headerContainer: {
    position: 'relative',
    height: 250,
    marginBottom: 20,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  placeholderText: {
    fontSize: 60,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  destinationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  tripMeta: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },

  // Summary Styles
  summaryContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },

  // Itinerary Styles
  itineraryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dayContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayHeader: {
    backgroundColor: Colors.PRIMARY,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  themeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  themeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  activitiesContainer: {
    padding: 15,
  },

  // Activity Card Styles
  activityCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: Colors.PRIMARY,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  timePeriodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
  ratingContainer: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  activityDetails: {
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  locationButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'
import { useRouter } from 'expo-router'

export default function Login() {
  const router = useRouter(); 

  return (
    // 1. Give the outer wrapper flex: 1 so it knows exactly how big the screen is
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      
      <Image 
        source={require('./../assets/images/Login.png')}
        style={{
          width: '100%',
          height: 460
        }}
      />
      
      <View style={styles.container}>
        <Text style={{
          fontSize: 20,
          fontFamily: 'poppins-semi',
          textAlign: 'center',
          marginTop: 10,
          lineHeight: 30, // FIX: Prevents top/bottom of custom font from getting cut off
        }}>
          Roamly - Plan Your Next Journey
        </Text>
        
        <Text style={{
  fontFamily: 'poppins',
  fontSize: 15,
  textAlign: 'center',
  color: Colors.GRAY,
  marginTop: 20,
  lineHeight: 28, // Slightly increased for the nested bold text
}}>
  <Text style={{ fontFamily: 'poppins-semi', color: '#1a1a2e' }}>Discover it. </Text>
  Find your next adventure effortlessly.{'\n'}
  
  <Text style={{ fontFamily: 'poppins-semi', color: '#1a1a2e'  }}>Plan it. </Text>
  Craft your personalized itinerary instantly.{'\n'}
  
  <Text style={{ fontFamily: 'poppins-semi', color: '#1a1a2e' }}>Roam it. </Text>
  Pack your bags, the world is waiting.{'\n\n'}
  
  <Text style={{ fontFamily: 'poppins-semi', color: '#1a1a2e' }}>
    Make every journey unforgettable!
  </Text>
</Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('auth/sign-in')}
        > 
          <Text style={{
            color: Colors.WHITE,
            textAlign: 'center',
            fontFamily: 'poppins-light',
            fontSize: 18,
          }}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginTop: -30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    flex: 1,           // FIX: Replaces height: '100%' so it perfectly fills the remaining space
    padding: 25,
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 99,
    marginTop: '20%',
  }
})
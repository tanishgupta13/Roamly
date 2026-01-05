import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function StartNewTripCard() {
    const router=useRouter();
  return (
    <View
    style={{
        padding:20,
        marginTop:50,
        display:'flex',
        alignItems:'center',
        gap:25
    }}>
      <Entypo name="location" size={30} color="black" />
      <Text style={{
        fontSize:25,
        fontFamily:'poppins-light',
        marginTop:10
      }}>
        No trips planned yet
      </Text>
      <Text style={{
        fontSize:20,
        fontFamily:'poppins',
        textAlign:'center',
        color:Colors.GRAY
      }}>
        Looks like its time to plan a new travel experience! Get Started below
      </Text>

      <TouchableOpacity
      onPress={()=>router.push('/create-trip/search-place')}
      style={{
        padding:15,
        backgroundColor:Colors.GRAY,
        borderRadius:15,
        paddingHorizontal:30
      }}>
        <Text style={{
            color:Colors.WHITE,
            fontFamily:'poppins-medium',
            fontSize:17
        }}>Start a new trip</Text>
      </TouchableOpacity>
    </View>
  )
}
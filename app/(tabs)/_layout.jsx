import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '@/constants/Colors';


export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown:false,
      tabBarActiveTintColor:Colors.PRIMARY
    }}>
        <Tabs.Screen name="mytrip"
        options={{
          tabBarLabel:'My Trip',
          tabBarIcon:({color })=><FontAwesome name="map-marker" size={24} color={color} />
        }}/>
        <Tabs.Screen name="discover"
         options={{
          tabBarLabel:'Discover',
          tabBarIcon:({color })=><Entypo name="globe" size={24} color={color} />
        }}/>
        <Tabs.Screen name="profile"
         options={{
          tabBarLabel:'Profile',
          tabBarIcon:({color })=><Ionicons name="people-circle" size={24} color={color} />
        }}/>
    </Tabs>
  )
}
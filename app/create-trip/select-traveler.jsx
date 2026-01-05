import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigation, useRouter } from 'expo-router'
import { SelectTravelesList } from '@/constants/Options'
import { Colors } from '@/constants/Colors'
import { CreateTripContext } from '@/context/CreateTripContext'
import OptionCard from '@/components/CreateTrip/OptionCard'
import SelectDate from './dateSelection'
import { selectTravelersList } from '@/constants/data'

export default function SelectTraveler() {
  const navigation = useNavigation()
  const router = useRouter()
  const [selectedTraveler, setSelectedTraveler] = useState(null)
  const { tripData, setTripData } = useContext(CreateTripContext)

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: ''
    })
  }, [])

  useEffect(() => {
    if (selectedTraveler) {
      setTripData(prev => ({
        ...prev,
        traveler: selectedTraveler
      }))
    }
  }, [selectedTraveler])

  const handleContinue = () => {
    if (selectedTraveler) {
      router.push('/create-trip/dateSelection' )
    }
  }

  return (
    <View style={{
      padding: 25,
      paddingTop: 75,
      backgroundColor: Colors.WHITE,
      flex: 1
    }}>
      <Text style={{
        fontSize: 35,
        fontFamily: 'poppins-semi',
        marginTop: 10
      }}>Who's Traveling</Text>
      
      <FlatList
        data={selectTravelersList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => setSelectedTraveler(item)}
            style={{marginVertical: 10}}>
            <OptionCard option={item} selectedOption={selectedTraveler}/>
          </TouchableOpacity>
        )}
      />
      
      <TouchableOpacity 
        style={{
          padding: 15,
          backgroundColor: Colors.PRIMARY,
          borderRadius: 15,
          marginTop: 20,
          opacity: selectedTraveler ? 1 : 0.5
        }}
        onPress={handleContinue}
        disabled={!selectedTraveler}>
        <Text style={{
          textAlign: 'center',
          color: Colors.WHITE,
          fontFamily: 'poppins-medium',
          fontSize: 20
        }}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}
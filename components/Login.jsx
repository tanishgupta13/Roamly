import { View, Text,Image,StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'
import { useRouter } from 'expo-router'

export default function Login() {

  const router=useRouter();  //to go from one screen to another screen
  return (
    <View>
            <Image source={require('./../assets/images/Login.png')}
      style={{
        width:'100%',
        height:460
      }}
      />
      <View style={styles.container}>
        <Text style={{
          fontSize:20,
          fontFamily:'poppins-semi',
          textAlign:'center',
          marginTop:10,
        }}>Roamly- Plan Your NextJourney</Text>
        <Text style={{
          fontFamily:'poppins',
          fontSize:17,
          textAlign:'center',
          color:Colors.GRAY,
          marginTop:20
        }}>Discover your next adventure effortlessly. Some text for the roamly application</Text>

        <TouchableOpacity style={styles.button}     //gives you ability to add events like onPress onClick
            onPress={()=>router.push('auth/sign-in')
        }> 
          <Text style={{
            color:Colors.WHITE,
            textAlign:'center',
            fontFamily:'poppins-light',
            fontSize:18,

            }}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    backgroundColor:Colors.WHITE,
    marginTop:-30,
    borderTopLeftRadius:40,
    borderTopRightRadius:40,
    
    height:'100%',
    padding:25,
    
    
  },
  button:{
    padding:15,
    backgroundColor:Colors.PRIMARY,
    borderRadius:99,
    marginTop:'20%',

  }
})

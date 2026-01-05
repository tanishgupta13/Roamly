import { View, Text,TextInput,StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native'
import React, { useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import {Colors} from './../../../constants/Colors'
import { useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../configs/FirebaseConfig';



export default function SignUp() {
    const router=useRouter();

    const [email,setEmail]=useState();
    const [password,setPassword]=useState();
    const [fullName,setFullName]=useState();

    const OnCreateAccount=()=>{

        if(!email&&!password&&!fullName){
            ToastAndroid.showWithGravity(
                'Please enter all details',  // Message to display
                ToastAndroid.LONG,           // Duration (can also be ToastAndroid.SHORT)
                ToastAndroid.BOTTOM 
            );
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    console.log(user);
    router.replace('/mytrip')
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage,errorCode);
    // ..
  });
    }
  return (
    <View
    style={{
        padding:25,
        paddingTop:50,
        backgroundColor:Colors.WHITE,
        height:'100%'
    }}>
        <TouchableOpacity
        onPress={()=>router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      <Text
      style={{
        fontFamily:'poppins-semi',
        fontSize:30,
        marginTop:30
      }}>Create New Account</Text>


      {/*User FullName*/}
      <View style={{
          marginTop:50
          }}>
          <Text style={{
                      fontFamily:'poppins'
                  }}>Full Name</Text>
                  <TextInput
                  style={styles.input}
                   placeholder='Enter Full Name'
                   onChangeText={(value)=>setFullName(value)}
                   />
              </View>


       {/*Email*/}
        <View style={{
          marginTop:50
          }}>
          <Text style={{
                      fontFamily:'poppins'
                  }}>Email</Text>
                  <TextInput
                  style={styles.input} 
                  placeholder='Enter Email'
                  onChangeText={(value)=>setEmail(value)}
                  />
              </View>
              
              {/*Password*/}
              <View style={{
                  marginTop:50
              }}>
                  <Text style={{
                      fontFamily:'poppins'
                  }}>Password</Text>
                  <TextInput
                  secureTextEntry={true}
                  style={styles.input} 
                  placeholder='Enter Password'
                  onChangeText={(value)=>setPassword(value)}
                  />
              </View>

        {/*Sign In Button */}
        <TouchableOpacity
        onPress={OnCreateAccount}
        style={{
            padding:20,
            backgroundColor:Colors.PRIMARY,
            borderRadius:15,
            marginTop:50,
        }}>
            <Text style={{
                color:Colors.WHITE,
                textAlign:'center'
            }}>
                Create Account
            </Text>

        </TouchableOpacity>

        {/*Create Account Button */}
        <TouchableOpacity
        onPress={()=>router.replace('./sign-in')}
        style={{
            padding:20,
            backgroundColor:Colors.WHITE,
            borderRadius:15,
            marginTop:20,
            borderWidth:1,
        }}>
            <Text style={{
                color:Colors.PRIMARY,
                textAlign:'center'
            }}>
                Sign In
            </Text>

        </TouchableOpacity>              
    </View>
  )
}


const styles = StyleSheet.create({
  input:{
      padding:15,
      borderWidth:1,
      borderRadius:15,
      borderColor:Colors.GRAY,
      fontFamily:'poppins'
}})

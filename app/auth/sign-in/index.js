import { View, Text,TextInput,StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native'
import React, { useEffect, useState } from 'react'
// import { useNavigation } from 'expo-router'
import {Colors} from './../../../constants/Colors'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../configs/FirebaseConfig';


export default function SignIn() {

    const router=useRouter();
    // //variable to disable the default header by react-native
    // const navigation=useNavigation();
    // useEffect(()=>{
    //     navigation.setOptions({
    //         headerShown:false
    //     })
    // },[])    //empty array to make it run only once otherwise it will be trapped in an infinite loop

    const [email,setEmail]=useState();
        const [password,setPassword]=useState();

    const onSignIn=()=>{

        if(!email&&!password){
                    ToastAndroid.showWithGravity(
                        'Please Enter Email & Password',  // Message to display
                        ToastAndroid.LONG,           // Duration (can also be ToastAndroid.SHORT)
                        ToastAndroid.BOTTOM 
                    );
                    return;
                }
                

        signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    router.replace('/mytrip')
    console.log(user);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage,errorCode);

    if(errorCode=='auth/missing-password'){
        ToastAndroid.show("Please enter your password", ToastAndroid.LONG)
    }

    if(errorCode=='auth/invalid-credential'||errorCode=="auth/invalid-email"){
        ToastAndroid.show("Invalid Credentials", ToastAndroid.LONG)
    }
  });
    }
  return (
    <View style={{
        padding:15,
        paddingTop:40,
        backgroundColor:Colors.WHITE,
        height:'100%',

    }
    }>
        <TouchableOpacity
        onPress={()=>router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{
            fontFamily:'poppins-semi',
            fontSize:30,
            marginTop:30,
        }}>Let's Sign You In</Text>
        <Text style={{
            fontFamily:'poppins-semi',
            fontSize:30,
            color:Colors.GRAY,
            marginTop:20,
        }}>Welcome Back</Text>
        <Text style={{
            fontFamily:'poppins-semi',
            fontSize:30,
            color:Colors.GRAY,
            marginTop:10,
        }}>You've been missed!!</Text>

        {/*Email*/}
        <View style={{
            marginTop:50
        }}>
            <Text style={{
                fontFamily:'poppins'
            }}>Email</Text>
            <TextInput
            style={styles.input}
            onChangeText={(value)=>setEmail(value)}
             placeholder='Enter Email'/>
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
            onChangeText={(value)=>setPassword(value)}
             placeholder='Enter Password'/>
        </View>

        {/*Sign In Button */}
        <TouchableOpacity
        onPress={onSignIn}
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
                Sign In
            </Text>

        </TouchableOpacity>

        {/*Create Account Button */}
        <TouchableOpacity
        onPress={()=>router.replace('./sign-up')}
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
                Create Account
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
  }
})

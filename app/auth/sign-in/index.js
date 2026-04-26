// import { View, Text,TextInput,StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native'
// import React, { useEffect, useState } from 'react'
// // import { useNavigation } from 'expo-router'
// import {Colors} from './../../../constants/Colors'
// import { useRouter } from 'expo-router'
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../../../configs/FirebaseConfig';


// export default function SignIn() {

//     const router=useRouter();
//     // //variable to disable the default header by react-native
//     // const navigation=useNavigation();
//     // useEffect(()=>{
//     //     navigation.setOptions({
//     //         headerShown:false
//     //     })
//     // },[])    //empty array to make it run only once otherwise it will be trapped in an infinite loop

//     const [email,setEmail]=useState();
//         const [password,setPassword]=useState();

//     const onSignIn=()=>{

//         if(!email&&!password){
//                     ToastAndroid.showWithGravity(
//                         'Please Enter Email & Password',  // Message to display
//                         ToastAndroid.LONG,           // Duration (can also be ToastAndroid.SHORT)
//                         ToastAndroid.BOTTOM 
//                     );
//                     return;
//                 }
                

//         signInWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed in 
//     const user = userCredential.user;
//     router.replace('/mytrip')
//     console.log(user);
//     // ...
//   })
//   .catch((error) => {
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     console.log(errorMessage,errorCode);

//     if(errorCode=='auth/missing-password'){
//         ToastAndroid.show("Please enter your password", ToastAndroid.LONG)
//     }

//     if(errorCode=='auth/invalid-credential'||errorCode=="auth/invalid-email"){
//         ToastAndroid.show("Invalid Credentials", ToastAndroid.LONG)
//     }
//   });
//     }
//   return (
//     <View style={{
//         padding:15,
//         paddingTop:40,
//         backgroundColor:Colors.WHITE,
//         height:'100%',

//     }
//     }>
//         <TouchableOpacity
//         onPress={()=>router.back()}>
//         <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text style={{
//             fontFamily:'poppins-semi',
//             fontSize:30,
//             marginTop:30,
//         }}>Let's Sign You In</Text>
//         <Text style={{
//             fontFamily:'poppins-semi',
//             fontSize:30,
//             color:Colors.GRAY,
//             marginTop:20,
//         }}>Welcome Back</Text>
//         <Text style={{
//             fontFamily:'poppins-semi',
//             fontSize:30,
//             color:Colors.GRAY,
//             marginTop:10,
//         }}>You've been missed!!</Text>

//         {/*Email*/}
//         <View style={{
//             marginTop:50
//         }}>
//             <Text style={{
//                 fontFamily:'poppins'
//             }}>Email</Text>
//             <TextInput
//             style={styles.input}
//             onChangeText={(value)=>setEmail(value)}
//              placeholder='Enter Email'/>
//         </View>
        
//         {/*Password*/}
//         <View style={{
//             marginTop:50
//         }}>
//             <Text style={{
//                 fontFamily:'poppins'
//             }}>Password</Text>
//             <TextInput
//             secureTextEntry={true}
//             style={styles.input}
//             onChangeText={(value)=>setPassword(value)}
//              placeholder='Enter Password'/>
//         </View>

//         {/*Sign In Button */}
//         <TouchableOpacity
//         onPress={onSignIn}
//          style={{
//             padding:20,
//             backgroundColor:Colors.PRIMARY,
//             borderRadius:15,
//             marginTop:50,
//         }}>
//             <Text style={{
//                 color:Colors.WHITE,
//                 textAlign:'center'
//             }}>
//                 Sign In
//             </Text>

//         </TouchableOpacity>

//         {/*Create Account Button */}
//         <TouchableOpacity
//         onPress={()=>router.replace('./sign-up')}
//         style={{
//             padding:20,
//             backgroundColor:Colors.WHITE,
//             borderRadius:15,
//             marginTop:20,
//             borderWidth:1,
//         }}>
//             <Text style={{
//                 color:Colors.PRIMARY,
//                 textAlign:'center'
//             }}>
//                 Create Account
//             </Text>

//         </TouchableOpacity>
      
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   input:{
//     padding:15,
//     borderWidth:1,
//     borderRadius:15,
//     borderColor:Colors.GRAY,
//     fontFamily:'poppins'
//   }
// })




import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ToastAndroid, 
  Animated, PanResponder, Dimensions, Modal , ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import React, { useState, useRef } from 'react';
import { Colors } from './../../../constants/Colors';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../configs/FirebaseConfig';
import LottieView from 'lottie-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 50; 
const SLIDE_DISTANCE = SLIDER_WIDTH - 60; 

export default function SignIn() {
  const router = useRouter();

  // --- Unified Form State ---
  const [contactValue, setContactValue] = useState(''); 
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // --- Feature State ---
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Animations & Refs ---
  const pan = useRef(new Animated.ValueXY()).current;
  
  const stateRef = useRef({ isValid: false, isVerified: false });
  
  // Smart Validation: If they typed an '@', they need a password. Otherwise, just the number is fine.
  stateRef.current = {
    isValid: contactValue.includes('@') ? !!(contactValue && password) : !!contactValue,
    isVerified: captchaVerified
  };

  const handleInputChange = (setter, value) => {
    setter(value);
    if (captchaVerified) {
      setCaptchaVerified(false);
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (!stateRef.current.isValid) {
          ToastAndroid.showWithGravity('Please fill required details first', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
          return false; 
        }
        return !stateRef.current.isVerified;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && gesture.dx <= SLIDE_DISTANCE && !stateRef.current.isVerified) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (stateRef.current.isVerified) return;

        if (gesture.dx >= SLIDE_DISTANCE - 20) {
          Animated.spring(pan, { toValue: { x: SLIDE_DISTANCE, y: 0 }, useNativeDriver: false }).start();
          setCaptchaVerified(true);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start();
        }
      }
    })
  ).current;

  const onSignIn = async () => {
    if (!captchaVerified) return;
    setLoading(true);

    // SMART DETECTION: Is this an email or a phone number?
    const isEmail = contactValue.includes('@');

    try {
      if (isEmail) {
        // --- EMAIL FLOW ---
        const userCredential = await signInWithEmailAndPassword(auth, contactValue, password);
        const user = userCredential.user;

        // Security Check: Ensure they clicked the email link!
        if (!user.emailVerified) {
          setLoading(false);
          ToastAndroid.show('Please verify your email before logging in.', ToastAndroid.LONG);
          await auth.signOut(); // Kick them out until verified
          return;
        }

        setLoading(false);
        router.replace('/mytrip');

      } else {
        // --- MOBILE OTP MOCK FLOW ---
        // Firebase ignores the password field for phone numbers, so we trigger the OTP modal!
        setTimeout(() => {
          setLoading(false);
          setShowOtpModal(true); 
          ToastAndroid.show('Mock SMS Sent! Enter 123456 to test.', ToastAndroid.SHORT);
        }, 1200); 
      }
    } catch (error) {
      setLoading(false);
      const errorCode = error.code;

      if (errorCode === 'auth/missing-password') {
        ToastAndroid.show("Please enter your password", ToastAndroid.LONG);
      } else if (errorCode === 'auth/invalid-credential' || errorCode === "auth/invalid-email") {
        ToastAndroid.show("Invalid Credentials. Please check your details.", ToastAndroid.LONG);
      } else {
        ToastAndroid.show(error.message, ToastAndroid.LONG);
      }
    }
  };

  const confirmCode = async () => {
    if (otp === '123456') {
      setShowOtpModal(false);
      ToastAndroid.show('Phone Verified Successfully!', ToastAndroid.SHORT);
      router.replace('/mytrip'); 
    } else if (otp.length < 6) {
      ToastAndroid.show('Please enter all 6 digits.', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('Invalid OTP. Please try 123456', ToastAndroid.SHORT);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: Colors.WHITE }} 
      // 👇 Change 'height' to undefined right here!
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: 80 }]} // bumped padding slightly just to be safe
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: '-10%' }}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Let's Sign You In</Text>
      {/* --- STREAMING LOTTIE ANIMATION --- */}
      <View style={{ alignItems: 'center', marginTop: -80, height:280 }}>
                    <LottieView
                      // source={{ uri: 'https://assets3.lottiefiles.com/packages/lf20_jmejybvu.json' }}
                      source={require('../../../assets/animations/welcome.json')}
                      autoPlay
                      loop
                      style={{ width: 350, height: 350 }}
                    />
                  </View>
      <Text style={styles.subTitle}>Welcome Back</Text>
      <Text style={styles.smallSubTitle}>You've been missed!!</Text>

      {/* --- UNIFIED SMART INPUTS --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email or Mobile</Text>
        <TextInput 
          style={styles.input} 
          placeholder='Enter Email or Mobile Number' 
          autoCapitalize='none' 
          keyboardType='default'
          value={contactValue}
          onChangeText={(val) => handleInputChange(setContactValue, val)} 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password (Leave blank for Mobile OTP)</Text>
        <TextInput 
          secureTextEntry={true} 
          style={styles.input} 
          placeholder='Enter Password' 
          value={password}
          onChangeText={(val) => handleInputChange(setPassword, val)} 
        />
      </View>

      {/* --- ANIMATED CAPTCHA SLIDER --- */}
      <View style={styles.captchaContainer}>
        <Text style={styles.captchaText}>
          {captchaVerified ? "Verified Human! ✅" : "Slide to verify >>>"}
        </Text>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.captchaSlider,
            { transform: [{ translateX: pan.x }] },
            captchaVerified && { backgroundColor: '#4CAF50' } 
          ]}
        >
          <Ionicons name={captchaVerified ? "checkmark" : "arrow-forward"} size={24} color={Colors.WHITE} />
        </Animated.View>
      </View>

      <TouchableOpacity
        onPress={onSignIn}
        disabled={loading || !captchaVerified}
        style={[styles.primaryButton, (!captchaVerified || loading) && { opacity: 0.5 }]}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('./sign-up')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Don't have an account? Create one</Text>
      </TouchableOpacity>

      {/* --- OTP VERIFICATION MODAL --- */}
      <Modal visible={showOtpModal} animationType="slide" transparent={true}>
        <View style={styles.otpOverlay}>
          <View style={styles.otpBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color={Colors.PRIMARY} />
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalText}>Code sent to {contactValue}</Text>
            
            <TextInput 
              style={[styles.input, { width: '100%', textAlign: 'center', fontSize: 20, letterSpacing: 10, marginTop: 20 }]} 
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity onPress={confirmCode} style={[styles.primaryButton, { width: '100%' }]}>
              <Text style={styles.primaryButtonText}>Verify & Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowOtpModal(false)} style={{ marginTop: 20 }}>
              <Text style={{ color: Colors.GRAY }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 40, backgroundColor: Colors.WHITE, flexGrow: 1 },
  headerTitle: { fontFamily: 'poppins-semi', fontSize: 30, marginTop: -5 },
  subTitle: { fontFamily: 'poppins-semi', fontSize: 24, color: Colors.GRAY, marginTop: 10 },
  smallSubTitle: { fontFamily: 'poppins-semi', fontSize: 16, color: Colors.GRAY, marginTop: 5 },

  inputContainer: { marginTop: 20 },
  label: { fontFamily: 'poppins', color: Colors.GRAY },
  input: { padding: 15, borderWidth: 1, borderRadius: 15, borderColor: Colors.GRAY, fontFamily: 'poppins', marginTop: 5 },
  
  captchaContainer: {
    marginTop: 30, height: 60, backgroundColor: '#f0f0f0', borderRadius: 30,
    justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#ddd'
  },
  captchaText: { position: 'absolute', width: '100%', textAlign: 'center', color: Colors.GRAY, fontFamily: 'poppins-semi' },
  captchaSlider: {
    height: 50, width: 60, backgroundColor: Colors.PRIMARY, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginLeft: 5, elevation: 3
  },

  primaryButton: { padding: 20, backgroundColor: Colors.PRIMARY, borderRadius: 15, marginTop: 30 },
  primaryButtonText: { color: Colors.WHITE, textAlign: 'center', fontFamily: 'poppins-semi' },
  secondaryButton: { padding: 15, backgroundColor: Colors.WHITE, borderRadius: 15, marginTop: 15, borderWidth: 1 },
  secondaryButtonText: { color: Colors.PRIMARY, textAlign: 'center', fontFamily: 'poppins-semi' },

  modalTitle: { fontSize: 24, fontFamily: 'poppins-semi', marginTop: 20, color: Colors.PRIMARY },
  modalText: { fontSize: 16, fontFamily: 'poppins', textAlign: 'center', marginTop: 10, color: Colors.GRAY, lineHeight: 24 },
  
  otpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  otpBox: { width: '85%', backgroundColor: Colors.WHITE, borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 }
});
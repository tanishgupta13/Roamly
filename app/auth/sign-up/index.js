// import { View, Text,TextInput,StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native'
// import React, { useState } from 'react'
// import Ionicons from '@expo/vector-icons/Ionicons';
// import {Colors} from './../../../constants/Colors'
// import { useRouter } from 'expo-router'
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../../../configs/FirebaseConfig';



// export default function SignUp() {
//     const router=useRouter();

//     const [email,setEmail]=useState();
//     const [password,setPassword]=useState();
//     const [fullName,setFullName]=useState();

//     const OnCreateAccount=()=>{

//         if(!email&&!password&&!fullName){
//             ToastAndroid.showWithGravity(
//                 'Please enter all details',  // Message to display
//                 ToastAndroid.LONG,           // Duration (can also be ToastAndroid.SHORT)
//                 ToastAndroid.BOTTOM 
//             );
//             return;
//         }

//         createUserWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed up 
//     const user = userCredential.user;
//     console.log(user);
//     router.replace('/mytrip')
//     // ...
//   })
//   .catch((error) => {
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     console.log(errorMessage,errorCode);
//     // ..
//   });
//     }
//   return (
//     <View
//     style={{
//         padding:25,
//         paddingTop:50,
//         backgroundColor:Colors.WHITE,
//         height:'100%'
//     }}>
//         <TouchableOpacity
//         onPress={()=>router.back()}>
//         <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//       <Text
//       style={{
//         fontFamily:'poppins-semi',
//         fontSize:30,
//         marginTop:30
//       }}>Create New Account</Text>


//       {/*User FullName*/}
//       <View style={{
//           marginTop:50
//           }}>
//           <Text style={{
//                       fontFamily:'poppins'
//                   }}>Full Name</Text>
//                   <TextInput
//                   style={styles.input}
//                    placeholder='Enter Full Name'
//                    onChangeText={(value)=>setFullName(value)}
//                    />
//               </View>


//        {/*Email*/}
//         <View style={{
//           marginTop:50
//           }}>
//           <Text style={{
//                       fontFamily:'poppins'
//                   }}>Email</Text>
//                   <TextInput
//                   style={styles.input} 
//                   placeholder='Enter Email'
//                   onChangeText={(value)=>setEmail(value)}
//                   />
//               </View>
              
//               {/*Password*/}
//               <View style={{
//                   marginTop:50
//               }}>
//                   <Text style={{
//                       fontFamily:'poppins'
//                   }}>Password</Text>
//                   <TextInput
//                   secureTextEntry={true}
//                   style={styles.input} 
//                   placeholder='Enter Password'
//                   onChangeText={(value)=>setPassword(value)}
//                   />
//               </View>

//         {/*Sign In Button */}
//         <TouchableOpacity
//         onPress={OnCreateAccount}
//         style={{
//             padding:20,
//             backgroundColor:Colors.PRIMARY,
//             borderRadius:15,
//             marginTop:50,
//         }}>
//             <Text style={{
//                 color:Colors.WHITE,
//                 textAlign:'center'
//             }}>
//                 Create Account
//             </Text>

//         </TouchableOpacity>

//         {/*Create Account Button */}
//         <TouchableOpacity
//         onPress={()=>router.replace('./sign-in')}
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
//                 Sign In
//             </Text>

//         </TouchableOpacity>              
//     </View>
//   )
// }


// const styles = StyleSheet.create({
//   input:{
//       padding:15,
//       borderWidth:1,
//       borderRadius:15,
//       borderColor:Colors.GRAY,
//       fontFamily:'poppins'
// }})




import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ToastAndroid, 
  Animated, PanResponder, Dimensions, Modal, ScrollView ,
  KeyboardAvoidingView, Platform
} from 'react-native';
import React, { useState, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from './../../../constants/Colors';
import { useRouter } from 'expo-router';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPhoneNumber 
} from 'firebase/auth';
import { auth } from '../../../configs/FirebaseConfig';
import LottieView from 'lottie-react-native';

// 1. IMPORT THE RECAPTCHA COMPONENT
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 50; 
const SLIDE_DISTANCE = SLIDER_WIDTH - 60; 

export default function SignUp() {
  const router = useRouter();

  // --- Auth Method Toggle ---
  const [authMethod, setAuthMethod] = useState('email'); 

  // --- Form State ---
  const [contactValue, setContactValue] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  
  // --- Feature State ---
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null); 

  // --- Animations & Refs ---
  const pan = useRef(new Animated.ValueXY()).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // 2. CREATE A REF FOR THE RECAPTCHA
  const recaptchaVerifier = useRef(null);

  const stateRef = useRef({ isValid: false, isVerified: false });
  
 // Smart Validation: Mobile only needs Name + Phone. Email needs Name + Email + Password.
  stateRef.current = {
    isValid: authMethod === 'email' 
      ? !!(contactValue && password && fullName) 
      : !!(contactValue && fullName),
    isVerified: captchaVerified
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
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
          ToastAndroid.showWithGravity('Please fill all details first', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
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

//   const OnCreateAccount = async () => {
//     if (!captchaVerified) return;
//     setLoading(true);

//     try {
//       if (authMethod === 'email') {
//         const userCredential = await createUserWithEmailAndPassword(auth, contactValue, password);
//         await sendEmailVerification(userCredential.user);
        
//         setLoading(false);
//         setShowEmailModal(true);
//         startPulse();
//       } else {
//         const formattedPhone = contactValue.includes('+') ? contactValue : `+91${contactValue}`;
        
//         // 3. TRIGGER THE RECAPTCHA AND SEND THE SMS
//         const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
//         setConfirmResult(confirmation);
        
//         setLoading(false);
//         setShowOtpModal(true); 
//       }
//     } catch (error) {
//       setLoading(false);
//       if (error.code === 'auth/email-already-in-use') {
//         ToastAndroid.show('This email is already registered. Please Sign In.', ToastAndroid.LONG);
//       } else if (error.code === 'auth/invalid-phone-number') {
//         ToastAndroid.show('Invalid phone number format.', ToastAndroid.LONG);
//       } else {
//         ToastAndroid.show(error.message, ToastAndroid.LONG);
//       }
//     }
//   };

//   const confirmCode = async () => {
//     try {
//       if (!confirmResult) return;
//       await confirmResult.confirm(otp);
//       setShowOtpModal(false);
//       router.replace('/mytrip');
//     } catch (error) {
//       ToastAndroid.show('Invalid OTP code.', ToastAndroid.SHORT);
//     }
//   };

const OnCreateAccount = async () => {
    if (!captchaVerified) return;
    setLoading(true);

    try {
      if (authMethod === 'email') {
        // Email still uses real Firebase!
        const userCredential = await createUserWithEmailAndPassword(auth, contactValue, password);
        await sendEmailVerification(userCredential.user);
        
        setLoading(false);
        setShowEmailModal(true);
        startPulse();
      } else {
        // --- MOBILE MOCK ---
        // We pretend Firebase accepted the phone number
        setTimeout(() => {
          setLoading(false);
          setShowOtpModal(true); 
          ToastAndroid.show('Mock SMS Sent! Enter 123456 to test.', ToastAndroid.SHORT);
        }, 1200); 
      }
    } catch (error) {
      setLoading(false);
      ToastAndroid.show(error.message, ToastAndroid.LONG);
    }
  };

 const confirmCode = async () => {
    // strict check for our fake OTP
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 4. MOUNT THE RECAPTCHA COMPONENT */}
      {/* <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      /> */}

      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Create New Account</Text>
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

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, authMethod === 'email' && styles.toggleActive]}
          onPress={() => { setAuthMethod('email'); handleInputChange(setContactValue, ''); }}
        >
          <Text style={[styles.toggleText, authMethod === 'email' && styles.toggleTextActive]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, authMethod === 'mobile' && styles.toggleActive]}
          onPress={() => { setAuthMethod('mobile'); handleInputChange(setContactValue, ''); }}
        >
          <Text style={[styles.toggleText, authMethod === 'mobile' && styles.toggleTextActive]}>Mobile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder='Enter Full Name' 
          value={fullName}
          onChangeText={(val) => handleInputChange(setFullName, val)} 
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{authMethod === 'email' ? 'Email Address' : 'Mobile Number (+91)'}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={authMethod === 'email' ? 'Enter Email' : 'Enter Mobile Number'} 
          keyboardType={authMethod === 'email' ? 'email-address' : 'phone-pad'} 
          autoCapitalize='none' 
          value={contactValue}
          onChangeText={(val) => handleInputChange(setContactValue, val)} 
        />
      </View>

      {/* Password field strictly visible ONLY for Email signup */}
      {authMethod === 'email' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            secureTextEntry={true} 
            style={styles.input} 
            placeholder='Create Password' 
            value={password}
            onChangeText={(val) => handleInputChange(setPassword, val)} 
          />
        </View>
      )}

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
        onPress={OnCreateAccount}
        disabled={loading || !captchaVerified}
        style={[styles.primaryButton, (!captchaVerified || loading) && { opacity: 0.5 }]}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Processing..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('./sign-in')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
      </TouchableOpacity>

      <Modal visible={showEmailModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="mail-unread-outline" size={100} color={Colors.PRIMARY} />
          </Animated.View>
          <Text style={styles.modalTitle}>Check Your Email</Text>
          <Text style={styles.modalText}>
            We've sent a verification link to <Text style={{fontWeight: 'bold'}}>{contactValue}</Text>. 
          </Text>
          <TouchableOpacity 
            // 5. FIX: LOG THE USER OUT AND SEND TO SIGN-IN SCREEN
            onPress={async () => { 
              setShowEmailModal(false); 
              await auth.signOut(); // Force them out so they must verify
              router.replace('./sign-in'); 
            }} 
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  container: { padding: 25, paddingTop: 50, backgroundColor: Colors.WHITE, flexGrow: 1 },
  headerTitle: { fontFamily: 'poppins-semi', fontSize: 30, marginTop: 20 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, marginTop: 20, padding: 5 },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.WHITE, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1 },
  toggleText: { fontFamily: 'poppins-semi', color: Colors.GRAY },
  toggleTextActive: { color: Colors.PRIMARY },

  inputContainer: { marginTop: 20 },
  label: { fontFamily: 'poppins' },
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

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.WHITE, padding: 30 },
  modalTitle: { fontSize: 24, fontFamily: 'poppins-semi', marginTop: 20, color: Colors.PRIMARY },
  modalText: { fontSize: 16, fontFamily: 'poppins', textAlign: 'center', marginTop: 10, color: Colors.GRAY, lineHeight: 24 },
  
  otpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  otpBox: { width: '85%', backgroundColor: Colors.WHITE, borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 }
});
// import { onAuthStateChanged } from "firebase/auth";
// import { useState, useEffect } from "react";
// import { View } from "react-native";
// import Login from '../components/Login';
// import { auth } from './../configs/FirebaseConfig';
// import { router, useRouter } from "expo-router";
// import React from "react";
// import { User } from 'firebase/auth';

// export default function Index() {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       if (currentUser) {
//         router.replace("/mytrip");
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <View style={{ padding: 3, flex: 1 }}>
//       {!user && <Login />}
//     </View>
//   );
// }

// import { onAuthStateChanged } from "firebase/auth";
// import { useState, useEffect } from "react";
// import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
// import Login from '../components/Login';
// import { auth } from './../configs/FirebaseConfig';
// import { router } from "expo-router";
// import React from "react";
// import { User } from 'firebase/auth';

// export default function Index() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [authChecked, setAuthChecked] = useState(false);

//   useEffect(() => {
//     console.log("Setting up auth listener");
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
//       console.log("User UID:", currentUser?.uid);
//       setUser(currentUser);
//       setLoading(false);
//       setAuthChecked(true);
      
//       if (currentUser) {
//         console.log("User authenticated, navigating...");
//         router.replace("/(tabs)/mytrip");
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   console.log("Current state - Loading:", loading, "User:", !!user, "AuthChecked:", authChecked);

//   // Force logout for testing
//   const handleLogout = () => {
//     auth.signOut();
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <Text>Checking authentication...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Debug info */}
//       <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
//         <Text>Debug Info:</Text>
//         <Text>User exists: {user ? 'Yes' : 'No'}</Text>
//         <Text>Auth checked: {authChecked ? 'Yes' : 'No'}</Text>
//         {user && (
//           <TouchableOpacity 
//             style={{ backgroundColor: 'red', padding: 10, marginTop: 5 }}
//             onPress={handleLogout}
//           >
//             <Text style={{ color: 'white' }}>Force Logout (Testing)</Text>
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <View style={{ flex: 1, padding: 3 }}>
//         {!user && <Login />}
//         {user && <Text>User is logged in but navigation failed</Text>}
//       </View>
//     </View>
//   );
// }


import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import Login from '../components/Login';
import { auth } from './../configs/FirebaseConfig';
import React from "react";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const forceLogout = async () => {
      try {
        await signOut(auth);
        console.log("User signed out");
      } catch (error) {
        console.error("Error signing out:", error);
      } finally {
        setLoading(false);
      }
    };

    forceLogout();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Login />
    </View>
  );
}
// import { View, Text } from 'react-native'
// import React from 'react'

// export default function Profile() {
//   return (
//     <View>
//       <Text>Profile</Text>
//     </View>
//   )
// }

import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { auth } from "../../configs/FirebaseConfig"; // make sure this path is correct
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          </View>
        )}

        <Text style={styles.name}>{user?.displayName || "Guest User"}</Text>
        <Text style={styles.email}>{user?.email || "No email linked"}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons name="settings-outline" size={20} color="#007AFF" />
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { borderColor: "#FF3B30" }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={[styles.buttonText, { color: "#FF3B30" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: { alignItems: "center", marginVertical: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  placeholder: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 22, fontWeight: "bold", color: "#333" },
  email: { fontSize: 16, color: "#888" },
  section: { marginTop: 30 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  buttonText: { fontSize: 16, marginLeft: 10, color: "#007AFF" },
});

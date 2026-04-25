// // import { View, Text } from 'react-native'
// // import React from 'react'

// // export default function Profile() {
// //   return (
// //     <View>
// //       <Text>Profile</Text>
// //     </View>
// //   )
// // }

// import React, { useEffect, useState } from "react";
// import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// import { auth } from "../../configs/FirebaseConfig"; // make sure this path is correct
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { Ionicons } from "@expo/vector-icons";

// export default function Profile() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);
//     });
//     return unsubscribe;
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//     } catch (error) {
//       console.log("Error logging out:", error);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.profileHeader}>
//         {user?.photoURL ? (
//           <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
//         ) : (
//           <View style={styles.placeholder}>
//             <Ionicons name="person-circle-outline" size={100} color="#ccc" />
//           </View>
//         )}

//         <Text style={styles.name}>{user?.displayName || "Guest User"}</Text>
//         <Text style={styles.email}>{user?.email || "No email linked"}</Text>
//       </View>

//       <View style={styles.section}>
//         <TouchableOpacity style={styles.button}>
//           <Ionicons name="create-outline" size={20} color="#007AFF" />
//           <Text style={styles.buttonText}>Edit Profile</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.button}>
//           <Ionicons name="settings-outline" size={20} color="#007AFF" />
//           <Text style={styles.buttonText}>Settings</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={[styles.button, { borderColor: "#FF3B30" }]} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
//           <Text style={[styles.buttonText, { color: "#FF3B30" }]}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff", padding: 20 },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   profileHeader: { alignItems: "center", marginVertical: 30 },
//   profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
//   placeholder: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
//   name: { fontSize: 22, fontWeight: "bold", color: "#333" },
//   email: { fontSize: 16, color: "#888" },
//   section: { marginTop: 30 },
//   button: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderColor: "#eee",
//   },
//   buttonText: { fontSize: 16, marginLeft: 10, color: "#007AFF" },
// });



import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { auth } from "../../configs/FirebaseConfig";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  primary:   "#1A6B5A",   // deep jungle green
  accent:    "#F5A623",   // warm amber
  dark:      "#0D1F1B",
  card:      "#FFFFFF",
  bg:        "#F0F5F3",
  textMain:  "#0D1F1B",
  textSub:   "#6B8A82",
  border:    "#D9E8E3",
  danger:    "#E03434",
  success:   "#22C55E",
  badge:     "#FFF8EC",
};

// ── Fake local stats (replace with Firestore reads) ───────────────────────────
const MOCK_STATS = { trips: 12, countries: 8, wishlist: 24, photos: 137 };

// ── Achievements ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 1, icon: "✈️", label: "Frequent Flyer",    desc: "10+ trips planned",       earned: true  },
  { id: 2, icon: "🌍", label: "Globe Trotter",     desc: "5+ countries visited",    earned: true  },
  { id: 3, icon: "📸", label: "Memory Keeper",     desc: "100+ photos saved",       earned: true  },
  { id: 4, icon: "🏔️", label: "Adventurer",        desc: "3 adventure trips",       earned: false },
  { id: 5, icon: "🏖️", label: "Beach Bum",         desc: "5 beach destinations",    earned: false },
  { id: 6, icon: "🌟", label: "Elite Explorer",    desc: "20+ countries visited",   earned: false },
];

// ── Quick-action menu items ───────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "trips",     icon: "map-outline",            label: "My Trips",        color: C.primary },
  { id: "wishlist",  icon: "heart-outline",           label: "Wishlist",        color: "#E03434" },
  { id: "photos",    icon: "images-outline",          label: "Travel Photos",   color: "#7C3AED" },
  { id: "budget",    icon: "wallet-outline",          label: "Budget Tracker",  color: C.accent  },
];

// ── Settings items ────────────────────────────────────────────────────────────
const SETTING_GROUPS = [
  {
    title: "Account",
    items: [
      { id: "edit",       icon: "create-outline",          label: "Edit Profile",       arrow: true  },
      { id: "currency",   icon: "cash-outline",            label: "Preferred Currency", sub: "USD",  arrow: true },
      { id: "language",   icon: "language-outline",        label: "Language",           sub: "English", arrow: true },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "notif",      icon: "notifications-outline",   label: "Notifications",      toggle: true, toggleKey: "notifications" },
      { id: "darkmode",   icon: "moon-outline",            label: "Dark Mode",          toggle: true, toggleKey: "darkMode"      },
      { id: "offline",    icon: "cloud-download-outline",  label: "Offline Maps",       toggle: true, toggleKey: "offlineMaps"   },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help",       icon: "help-circle-outline",     label: "Help & FAQ",         arrow: true },
      { id: "feedback",   icon: "chatbubble-outline",      label: "Send Feedback",      arrow: true },
      { id: "rate",       icon: "star-outline",            label: "Rate the App",       arrow: true },
      { id: "privacy",    icon: "shield-checkmark-outline",label: "Privacy Policy",     arrow: true },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function Profile() {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [editVisible,  setEditVisible]  = useState(false);
  const [editName,     setEditName]     = useState("");
  const [savingName,   setSavingName]   = useState(false);
  const [prefs, setPrefs] = useState({ notifications: true, darkMode: false, offlineMaps: false });

  // Animations
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const scaleAnim  = useRef(new Animated.Value(0.85)).current;
  const scrollY    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) setEditName(u.displayName || "");
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1,  duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0,  duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  // Header parallax
  const headerTranslateY = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -60], extrapolate: "clamp" });
  const avatarScale      = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0.65], extrapolate: "clamp" });
  const avatarOpacity    = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0],    extrapolate: "clamp" });
  const headerOpacity    = scrollY.interpolate({ inputRange: [100, 160], outputRange: [0, 1],  extrapolate: "clamp" });

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out", style: "destructive",
          onPress: async () => {
            try { await signOut(auth); }
            catch (e) { console.error(e); }
          },
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: editName.trim() });
      setUser({ ...user, displayName: editName.trim() });
      setEditVisible(false);
    } catch (e) {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleQuickAction = (id) => {
    Alert.alert("Coming soon", `${id} screen is under construction! 🚧`);
  };

  const handleSettingPress = (id) => {
    if (id === "edit") { setEditVisible(true); return; }
    Alert.alert("Coming soon", `${id} is under construction! 🚧`);
  };

  const getInitials = () => {
    const name = user?.displayName || user?.email || "G";
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={[C.primary, "#0D3D32"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Sticky mini-header (appears on scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.stickyName} numberOfLines={1}>
          {user?.displayName || "Profile"}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ── Hero header ── */}
        <Animated.View style={[styles.hero, { transform: [{ translateY: headerTranslateY }] }]}>
          <LinearGradient colors={[C.dark, C.primary, "#2D9B7B"]} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} />

          {/* Decorative circles */}
          <View style={[styles.deco, { top: -40, right: -40, width: 160, height: 160, opacity: 0.08 }]} />
          <View style={[styles.deco, { bottom: 10, left: -30, width: 100, height: 100, opacity: 0.06 }]} />

          <View style={styles.heroContent}>
            {/* Avatar */}
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: avatarScale }], opacity: avatarOpacity }]}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[C.accent, "#F57F17"]} style={styles.avatarPlaceholder}>
                  <Text style={styles.initials}>{getInitials()}</Text>
                </LinearGradient>
              )}
              <View style={styles.onlineDot} />
            </Animated.View>

            <Animated.View style={{ opacity: avatarOpacity, alignItems: "center" }}>
              <Text style={styles.heroName}>{user?.displayName || "Explorer"}</Text>
              <Text style={styles.heroEmail}>{user?.email || "No email linked"}</Text>

              {/* Member badge */}
              <View style={styles.memberBadge}>
                <Ionicons name="shield-checkmark" size={11} color={C.accent} />
                <Text style={styles.memberBadgeText}>Premium Traveller</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            {[
              { label: "Trips",     value: MOCK_STATS.trips,    icon: "airplane-outline"     },
              { label: "Countries", value: MOCK_STATS.countries, icon: "earth-outline"        },
              { label: "Wishlist",  value: MOCK_STATS.wishlist,  icon: "heart-outline"        },
              { label: "Photos",    value: MOCK_STATS.photos,    icon: "camera-outline"       },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons name={s.icon} size={18} color={C.primary} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Quick actions ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity key={a.id} style={styles.quickCard} onPress={() => handleQuickAction(a.id)} activeOpacity={0.82}>
                  <View style={[styles.quickIcon, { backgroundColor: a.color + "18" }]}>
                    <Ionicons name={a.icon} size={22} color={a.color} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Achievements ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Text style={styles.sectionSub}>{ACHIEVEMENTS.filter(a => a.earned).length}/{ACHIEVEMENTS.length} earned</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 18 }}>
              {ACHIEVEMENTS.map(a => (
                <View key={a.id} style={[styles.achieveCard, !a.earned && styles.achieveCardLocked]}>
                  <Text style={[styles.achieveIcon, !a.earned && { opacity: 0.35 }]}>{a.icon}</Text>
                  <Text style={[styles.achieveLabel, !a.earned && { color: C.textSub }]}>{a.label}</Text>
                  <Text style={styles.achieveDesc}>{a.desc}</Text>
                  {!a.earned && (
                    <View style={styles.lockedOverlay}>
                      <Ionicons name="lock-closed" size={12} color={C.textSub} />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Travel personality card ── */}
          <View style={styles.section}>
            <View style={[styles.personalityCard]}>
              <LinearGradient colors={[C.primary, "#2D9B7B"]} style={styles.personalityGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.personalityContent}>
                <Text style={styles.personalityLabel}>Your Travel Style</Text>
                <Text style={styles.personalityTitle}>Adventure Seeker 🏔️</Text>
                <Text style={styles.personalityDesc}>You love off-the-beaten-path experiences and immersive cultural encounters.</Text>
                <TouchableOpacity style={styles.personalityBtn} onPress={() => Alert.alert("Quiz", "Take the travel personality quiz! 🚧")}>
                  <Text style={styles.personalityBtnText}>Retake Quiz</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.personalityBg}>🌍</Text>
            </View>
          </View>

          {/* ── Settings groups ── */}
          {SETTING_GROUPS.map(group => (
            <View key={group.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <View style={styles.settingsCard}>
                {group.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.settingRow, idx < group.items.length - 1 && styles.settingRowBorder]}
                    onPress={() => !item.toggle && handleSettingPress(item.id)}
                    activeOpacity={item.toggle ? 1 : 0.7}
                  >
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconBox}>
                        <Ionicons name={item.icon} size={18} color={C.primary} />
                      </View>
                      <View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                        {item.sub && <Text style={styles.settingSub}>{item.sub}</Text>}
                      </View>
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={prefs[item.toggleKey]}
                        onValueChange={v => setPrefs(p => ({ ...p, [item.toggleKey]: v }))}
                        trackColor={{ false: C.border, true: C.primary + "80" }}
                        thumbColor={prefs[item.toggleKey] ? C.primary : "#ccc"}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={C.textSub} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── Logout ── */}
          <View style={[styles.section, { paddingBottom: 40 }]}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={C.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>AI Travel Planner • v1.0.0</Text>
          </View>

        </Animated.View>
      </Animated.ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <Text style={styles.modalSub}>This is how you'll appear in the app</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name..."
              placeholderTextColor={C.textSub}
              autoFocus
              maxLength={40}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName}>
                {savingName
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalSaveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },

  loadingScreen:   { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText:     { color: "#fff", fontFamily: "poppins", fontSize: 14 },

  // Sticky header
  stickyHeader:    {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    height: 90, justifyContent: "flex-end", paddingBottom: 14, alignItems: "center",
  },
  stickyName:      { fontFamily: "poppins-semi", fontSize: 16, color: "#fff" },

  // Hero
  hero:            { height: 300, overflow: "hidden", justifyContent: "flex-end" },
  heroContent:     { alignItems: "center", paddingBottom: 28, gap: 10 },
  deco:            { position: "absolute", borderRadius: 999, backgroundColor: "#fff" },

  avatarRing:      {
    width: 104, height: 104, borderRadius: 52,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    padding: 3, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  avatar:          { width: "100%", height: "100%", borderRadius: 50 },
  avatarPlaceholder:{ width: "100%", height: "100%", borderRadius: 50, justifyContent: "center", alignItems: "center" },
  initials:        { fontFamily: "poppins-semi", fontSize: 32, color: "#fff" },
  onlineDot:       {
    position: "absolute", bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.success, borderWidth: 2, borderColor: "#fff",
  },

  heroName:        { fontFamily: "poppins-semi", fontSize: 22, color: "#fff" },
  heroEmail:       { fontFamily: "poppins", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  memberBadge:     {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(245,166,35,0.2)", borderWidth: 1, borderColor: "rgba(245,166,35,0.4)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 4,
  },
  memberBadgeText: { fontFamily: "poppins-semi", fontSize: 11, color: C.accent },

  // Stats
  statsRow:        {
    flexDirection: "row", marginHorizontal: 18, marginTop: -22,
    backgroundColor: C.card, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4, zIndex: 10,
  },
  statCard:        { flex: 1, alignItems: "center", paddingVertical: 16, gap: 3 },
  statValue:       { fontFamily: "poppins-semi", fontSize: 18, color: C.textMain },
  statLabel:       { fontFamily: "poppins", fontSize: 10, color: C.textSub },

  // Section
  section:         { marginTop: 20, paddingHorizontal: 18 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:    { fontFamily: "poppins-semi", fontSize: 15, color: C.textMain, marginBottom: 12 },
  sectionSub:      { fontFamily: "poppins", fontSize: 12, color: C.textSub },

  // Quick actions
  quickGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard:       {
    width: (width - 18 * 2 - 12) / 2 - 1,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2,
  },
  quickIcon:       { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  quickLabel:      { fontFamily: "poppins-semi", fontSize: 13, color: C.textMain, flexShrink: 1 },

  // Achievements
  achieveCard:     {
    width: 120, backgroundColor: C.card, borderRadius: 16, padding: 14,
    alignItems: "center", gap: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 2, borderWidth: 1.5, borderColor: C.accent + "40",
  },
  achieveCardLocked:{ borderColor: C.border, opacity: 0.7 },
  achieveIcon:     { fontSize: 28 },
  achieveLabel:    { fontFamily: "poppins-semi", fontSize: 11, color: C.textMain, textAlign: "center" },
  achieveDesc:     { fontFamily: "poppins", fontSize: 9, color: C.textSub, textAlign: "center" },
  lockedOverlay:   {
    position: "absolute", top: 8, right: 8,
    backgroundColor: C.bg, borderRadius: 10, padding: 3,
  },

  // Personality card
  personalityCard: { borderRadius: 20, overflow: "hidden", height: 150 },
  personalityGrad: { ...StyleSheet.absoluteFillObject },
  personalityContent:{ flex: 1, padding: 20, justifyContent: "center", zIndex: 1 },
  personalityLabel:{ fontFamily: "poppins", fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  personalityTitle:{ fontFamily: "poppins-semi", fontSize: 20, color: "#fff", marginBottom: 4 },
  personalityDesc: { fontFamily: "poppins", fontSize: 12, color: "rgba(255,255,255,0.8)", width: "70%" },
  personalityBtn:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  personalityBtnText:{ fontFamily: "poppins-semi", fontSize: 12, color: C.accent },
  personalityBg:   { position: "absolute", right: 16, top: "50%", fontSize: 72, opacity: 0.15, transform: [{ translateY: -36 }] },

  // Settings
  settingsCard:    {
    backgroundColor: C.card, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2, overflow: "hidden",
  },
  settingRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  settingRowBorder:{ borderBottomWidth: 1, borderBottomColor: C.border },
  settingLeft:     { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconBox:  { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + "12", justifyContent: "center", alignItems: "center" },
  settingLabel:    { fontFamily: "poppins-semi", fontSize: 14, color: C.textMain },
  settingSub:      { fontFamily: "poppins", fontSize: 11, color: C.textSub, marginTop: 1 },

  // Logout
  logoutBtn:       {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: "#FECACA",
  },
  logoutText:      { fontFamily: "poppins-semi", fontSize: 15, color: C.danger },
  versionText:     { fontFamily: "poppins", fontSize: 11, color: C.textSub, textAlign: "center", marginTop: 16 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:      {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingTop: 16, gap: 8,
  },
  modalHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 12 },
  modalTitle:      { fontFamily: "poppins-semi", fontSize: 20, color: C.textMain },
  modalSub:        { fontFamily: "poppins", fontSize: 13, color: C.textSub, marginBottom: 8 },
  modalInput:      {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: "poppins", fontSize: 15, color: C.textMain, marginBottom: 8,
  },
  modalActions:    { flexDirection: "row", gap: 10, marginTop: 8 },
  modalCancel:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.bg, alignItems: "center" },
  modalCancelText: { fontFamily: "poppins-semi", fontSize: 15, color: C.textSub },
  modalSave:       { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: "center" },
  modalSaveText:   { fontFamily: "poppins-semi", fontSize: 15, color: "#fff" },
});
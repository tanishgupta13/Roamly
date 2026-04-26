import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Animated, Dimensions,
  Alert, Modal, TextInput, Switch, StatusBar, Linking, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../configs/FirebaseConfig";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors } from '../../constants/Colors';
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");
const SAVED_PLACES_KEY = 'roamly_saved_places';

const C = {
  primary:  "#1A6B5A",
  accent:   "#F5A623",
  dark:     "#0D1F1B",
  card:     "#FFFFFF",
  bg:       "#F0F5F3",
  textMain: "#0D1F1B",
  textSub:  "#6B8A82",
  border:   "#D9E8E3",
  danger:   "#E03434",
  success:  "#22C55E",
};

const TRAVEL_AVATARS = [
  { id: "a1",  emoji: "🧳", label: "Backpacker"    },
  { id: "a2",  emoji: "🏔️", label: "Mountaineer"   },
  { id: "a3",  emoji: "🏖️", label: "Beach Lover"   },
  { id: "a4",  emoji: "🌍", label: "Globe Trotter"  },
  { id: "a5",  emoji: "🗺️", label: "Explorer"       },
  { id: "a6",  emoji: "🚀", label: "Adventurer"     },
  { id: "a7",  emoji: "🏕️", label: "Camper"         },
  { id: "a8",  emoji: "🤿", label: "Diver"          },
  { id: "a9",  emoji: "🛶", label: "Kayaker"        },
  { id: "a10", emoji: "🎒", label: "Hiker"          },
  { id: "a11", emoji: "🌸", label: "Culture Fan"    },
  { id: "a12", emoji: "📸", label: "Photographer"   },
  { id: "a13", emoji: "🍜", label: "Food Traveller" },
  { id: "a14", emoji: "🎭", label: "Art Lover"      },
  { id: "a15", emoji: "🦁", label: "Safari Goer"    },
  { id: "a16", emoji: "⛷️", label: "Skier"          },
  { id: "a17", emoji: "🚢", label: "Cruiser"        },
  { id: "a18", emoji: "🏛️", label: "History Buff"   },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹",   label: "Indian Rupee"      },
  { code: "USD", symbol: "$",   label: "US Dollar"          },
  { code: "EUR", symbol: "€",   label: "Euro"               },
  { code: "GBP", symbol: "£",   label: "British Pound"      },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham"         },
  { code: "SGD", symbol: "S$",  label: "Singapore Dollar"   },
  { code: "JPY", symbol: "¥",   label: "Japanese Yen"       },
  { code: "AUD", symbol: "A$",  label: "Australian Dollar"  },
  { code: "CAD", symbol: "C$",  label: "Canadian Dollar"    },
  { code: "THB", symbol: "฿",   label: "Thai Baht"          },
];

const LANGUAGES = [
  { code: "en", label: "English",    native: "English"   },
  { code: "hi", label: "Hindi",      native: "हिन्दी"     },
  { code: "mr", label: "Marathi",    native: "मराठी"      },
  { code: "es", label: "Spanish",    native: "Español"   },
  { code: "fr", label: "French",     native: "Français"  },
  { code: "de", label: "German",     native: "Deutsch"   },
  { code: "ja", label: "Japanese",   native: "日本語"     },
  { code: "zh", label: "Chinese",    native: "中文"       },
  { code: "ar", label: "Arabic",     native: "العربية"   },
  { code: "pt", label: "Portuguese", native: "Português" },
];

const buildAchievements = (tripCount) => [
  { id: 1, icon: "✈️", label: "First Flight",   desc: "Plan your first trip",    earned: tripCount >= 1  },
  { id: 2, icon: "🗺️", label: "Trip Maker",     desc: "3+ trips planned",        earned: tripCount >= 3  },
  { id: 3, icon: "🌍", label: "Globe Trotter",  desc: "5+ trips planned",        earned: tripCount >= 5  },
  { id: 4, icon: "🏆", label: "Expert Planner", desc: "10+ trips planned",       earned: tripCount >= 10 },
  { id: 5, icon: "🌟", label: "Elite Explorer", desc: "20+ trips planned",       earned: tripCount >= 20 },
  { id: 6, icon: "🔥", label: "On Fire",        desc: "Plan 3 trips in a month", earned: false           },
];

const PERSONALITIES = [
  { title: "Adventure Seeker 🏔️",   desc: "Off-the-beaten-path & immersive cultural encounters.",  min: 0  },
  { title: "Luxury Traveller 🥂",    desc: "You enjoy comfort, fine dining & premium experiences.", min: 5  },
  { title: "Budget Explorer 🎒",     desc: "Maximum experiences at minimum cost is your mantra.",   min: 10 },
  { title: "Culture Connoisseur 🎭", desc: "Art, history and local culture drive your wanderlust.", min: 15 },
];
const getPersonality = (n) => [...PERSONALITIES].reverse().find(p => n >= p.min) || PERSONALITIES[0];

const KEYS = {
  avatar:        "roamly_avatar",
  currency:      "roamly_currency",
  language:      "roamly_language",
  notifications: "roamly_notif",
  darkMode:      "roamly_dark",
  offlineMaps:   "roamly_offline",
};

export default function Profile() {
  const router = useRouter();

  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tripCount,   setTripCount]   = useState(0);
  const [editVisible, setEditVisible] = useState(false);
  const [editName,    setEditName]    = useState("");
  const [savingName,  setSavingName]  = useState(false);

  const [savedPlaces,      setSavedPlaces]      = useState([]);
  const [savedTripsVisible, setSavedTripsVisible] = useState(false);

  const [selectedAvatar,   setSelectedAvatar]   = useState(null);
  const [avatarModal,      setAvatarModal]       = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [currencyModal,    setCurrencyModal]     = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [languageModal,    setLanguageModal]     = useState(false);
  const [rateModal,        setRateModal]         = useState(false);
  const [ratingStars,      setRatingStars]       = useState(0);
  const [ratingComment,    setRatingComment]     = useState("");
  const [ratingSubmitted,  setRatingSubmitted]   = useState(false);

  const [prefs, setPrefs] = useState({
    notifications: true,
    darkMode:      false,
    offlineMaps:   false,
  });

 
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY   = useRef(new Animated.Value(0)).current;

  // ── Load AsyncStorage prefs ───────────────────────────────────────────────
 // Runs every time the tab comes into focus

  const fetchTripCount = useCallback(async (email) => {
  if (!email) return;
  try {
    const q = query(collection(db, "UserTrips"), where("userEmail", "==", email));
    const snap = await getDocs(q);
    setTripCount(snap.size);
  } catch (e) { console.warn("Could not fetch trip count:", e); }
}, []);


useFocusEffect(
  React.useCallback(() => {
    (async () => {
      try {
        const [av, cu, la, no, dm, om, sp] = await Promise.all([
          AsyncStorage.getItem(KEYS.avatar),
          AsyncStorage.getItem(KEYS.currency),
          AsyncStorage.getItem(KEYS.language),
          AsyncStorage.getItem(KEYS.notifications),
          AsyncStorage.getItem(KEYS.darkMode),
          AsyncStorage.getItem(KEYS.offlineMaps),
          AsyncStorage.getItem(SAVED_PLACES_KEY),
        ]);
        if (av) setSelectedAvatar(JSON.parse(av));
        if (cu) setSelectedCurrency(JSON.parse(cu));
        if (la) setSelectedLanguage(JSON.parse(la));
        if (sp) {
          const parsed = JSON.parse(sp);
          setSavedPlaces(parsed);
          setSavedIds(new Set(parsed.map(p => p.id)));
        } else {
          setSavedPlaces([]);
          setSavedIds(new Set());
        }
        setPrefs({
          notifications: no !== null ? JSON.parse(no) : true,
          darkMode:      dm !== null ? JSON.parse(dm) : false,
          offlineMaps:   om !== null ? JSON.parse(om) : false,
        });
      } catch (e) { console.warn("AsyncStorage load error:", e); }

      // Re-fetch trip count every time tab is focused
      if (auth.currentUser?.email) {
        fetchTripCount(auth.currentUser.email);
      }
    })();
  }, [fetchTripCount])
);



 useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    setUser(u);
    setEditName(u?.displayName || "");
    if (u) {
      try {
        // Fetch trip count
        const q = query(collection(db, "UserTrips"), where("userEmail", "==", u.email));
        const snap = await getDocs(q);
        setTripCount(snap.size);
      } catch (e) { console.warn("Could not fetch trip count:", e); }

     try {
  // Pull saved places from Firestore and sync to AsyncStorage
  const savedSnap = await getDocs(collection(db, "users", u.uid, "savedPlaces"));
  const firestorePlaces = savedSnap.docs.map(d => d.data());
  if (firestorePlaces.length > 0) {
    setSavedPlaces(firestorePlaces);
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(firestorePlaces));
  }
} catch (e) { console.warn("Could not sync saved places from Firestore:", e); }
    } else {
      // User logged out — clear saved places
      setSavedPlaces([]);
    }
    setLoading(false);
  });
  return unsub;
}, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const headerTranslateY = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -60], extrapolate: "clamp" });
  const avatarScale      = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0.65], extrapolate: "clamp" });
  const avatarOpacity    = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0],    extrapolate: "clamp" });
  const headerOpacity    = scrollY.interpolate({ inputRange: [100, 160], outputRange: [0, 1],  extrapolate: "clamp" });

  const setPref = async (key, value) => {
    setPrefs(p => ({ ...p, [key]: value }));
    try {
      await AsyncStorage.setItem(KEYS[key], JSON.stringify(value));
      if (key === "notifications") Alert.alert(value ? "Notifications On 🔔" : "Notifications Off 🔕", value ? "You'll receive trip reminders and updates." : "You won't receive push notifications.");
      if (key === "darkMode")      Alert.alert(value ? "Dark Mode On 🌙" : "Light Mode On ☀️", "Restart the app for the theme to fully apply.");
      if (key === "offlineMaps")   Alert.alert(value ? "Offline Maps On 🗺️" : "Offline Maps Off", value ? "Maps for your trips will be cached for offline use." : "Offline map caching disabled.");
    } catch (e) { console.warn("AsyncStorage save error:", e); }
  };

  const handleSelectAvatar = async (avatar) => {
    setSelectedAvatar(avatar);
    setAvatarModal(false);
    try { await AsyncStorage.setItem(KEYS.avatar, JSON.stringify(avatar)); }
    catch (e) { console.warn("Avatar save error:", e); }
  };

  const handleRemoveAvatar = async () => {
    setSelectedAvatar(null);
    setAvatarModal(false);
    try { await AsyncStorage.removeItem(KEYS.avatar); }
    catch (e) { console.warn("Avatar remove error:", e); }
  };

  const handleSelectCurrency = async (currency) => {
    setSelectedCurrency(currency);
    setCurrencyModal(false);
    try { await AsyncStorage.setItem(KEYS.currency, JSON.stringify(currency)); }
    catch (e) { console.warn("Currency save error:", e); }
  };

  const handleSelectLanguage = async (lang) => {
    setSelectedLanguage(lang);
    setLanguageModal(false);
    try { await AsyncStorage.setItem(KEYS.language, JSON.stringify(lang)); }
    catch (e) { console.warn("Language save error:", e); }
  };

  const handleSubmitRating = () => {
    if (ratingStars === 0) { Alert.alert("Please select a star rating first."); return; }
    setRatingSubmitted(true);
    setTimeout(() => {
      setRateModal(false);
      setRatingSubmitted(false);
      setRatingStars(0);
      setRatingComment("");
    }, 1800);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try { await signOut(auth); router.replace("/login"); }
          catch (e) { Alert.alert("Error", "Could not sign out. Please try again."); }
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: editName.trim() });
      setUser(prev => ({ ...prev, displayName: editName.trim() }));
      setEditVisible(false);
    } catch { Alert.alert("Error", "Could not update name. Please try again."); }
    finally { setSavingName(false); }
  };

  const handleQuickAction = (id) => {
    switch (id) {
      case "trips":      router.push("/(tabs)/mytrip");            break;
      case "discover":   router.push("/(tabs)/discover");          break;
      case "newtrip":    router.push("/create-trip/search-place"); break;
      case "savedtrips": setSavedTripsVisible(true);               break;
      case "support":    Linking.openURL("mailto:support@roamly.app?subject=Support Request"); break;
      default: Alert.alert("Coming Soon", "This feature is on its way! 🚧");
    }
  };

  const handleSettingPress = (id) => {
    switch (id) {
      case "edit":     setEditVisible(true);   break;
      case "currency": setCurrencyModal(true); break;
      case "language": setLanguageModal(true); break;
      case "rate":     setRateModal(true);     break;
      case "feedback": Linking.openURL("mailto:feedback@roamly.app?subject=App Feedback"); break;
      case "help":     Linking.openURL("https://roamly.app/help");    break;
      case "privacy":  Linking.openURL("https://roamly.app/privacy"); break;
      default: Alert.alert("Coming Soon", "This setting is on its way! 🚧");
    }
  };

  const getInitials = () => {
    const name = user?.displayName || user?.email || "G";
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  const achievements = buildAchievements(tripCount);
  const personality  = getPersonality(tripCount);
  const earnedCount  = achievements.filter(a => a.earned).length;

  const QUICK_ACTIONS = [
    { id: "trips",      icon: "map-outline",        label: "My Trips",     color: C.primary  },
    { id: "newtrip",    icon: "add-circle-outline",  label: "New Trip",     color: "#7C3AED"  },
    { id: "savedtrips", icon: "heart-outline",       label: "Saved Trips",  color: "#E03434"  },
    { id: "discover",   icon: "compass-outline",     label: "Discover",     color: C.accent   },
    { id: "support",    icon: "headset-outline",     label: "Support",      color: "#0EA5E9"  },
  ];

  const SETTING_GROUPS = [
    {
      title: "Account",
      items: [
        { id: "edit",     icon: "create-outline",  label: "Edit Display Name",  arrow: true },
        { id: "currency", icon: "cash-outline",     label: "Preferred Currency", sub: `${selectedCurrency.code} ${selectedCurrency.symbol}`, arrow: true },
        { id: "language", icon: "language-outline", label: "Language",            sub: selectedLanguage.label, arrow: true },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "notifications", icon: "notifications-outline",  label: "Push Notifications", toggle: true, toggleKey: "notifications" },
        { id: "darkMode",      icon: "moon-outline",           label: "Dark Mode",           toggle: true, toggleKey: "darkMode"      },
        { id: "offlineMaps",   icon: "cloud-download-outline", label: "Offline Maps",        toggle: true, toggleKey: "offlineMaps"   },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help",     icon: "help-circle-outline",      label: "Help & FAQ",      arrow: true },
        { id: "feedback", icon: "chatbubble-outline",       label: "Send Feedback",   arrow: true },
        { id: "rate",     icon: "star-outline",             label: "Rate the App ⭐", arrow: true },
        { id: "privacy",  icon: "shield-checkmark-outline", label: "Privacy Policy",  arrow: true },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={[C.primary, "#0D3D32"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.stickyName} numberOfLines={1}>{user?.displayName || "Profile"}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, { transform: [{ translateY: headerTranslateY }] }]}>
          <LinearGradient colors={[C.dark, C.primary, "#2D9B7B"]} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={[styles.deco, { top: -40, right: -40, width: 160, height: 160, opacity: 0.08 }]} />
          <View style={[styles.deco, { bottom: 10, left: -30, width: 100, height: 100, opacity: 0.06 }]} />

          <View style={styles.heroContent}>
            <Animated.View style={{ transform: [{ scale: avatarScale }], opacity: avatarOpacity }}>
              <TouchableOpacity onPress={() => setAvatarModal(true)} activeOpacity={0.85}>
                <View style={styles.avatarRing}>
                  {selectedAvatar ? (
                    <View style={styles.avatarEmojiWrap}>
                      <Text style={styles.avatarEmoji}>{selectedAvatar.emoji}</Text>
                    </View>
                  ) : user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={[C.accent, "#F57F17"]} style={styles.avatarPlaceholder}>
                      <Text style={styles.initials}>{getInitials()}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.onlineDot} />
                  <View style={styles.editAvatarHint}>
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: avatarOpacity, alignItems: "center", gap: 4 }}>
              <Text style={styles.heroName}>{user?.displayName || "Explorer"}</Text>
              <Text style={styles.heroEmail}>{user?.email || "No email linked"}</Text>
              <View style={styles.memberBadge}>
                <Ionicons name="shield-checkmark" size={11} color={C.accent} />
                <Text style={styles.memberBadgeText}>
                  {tripCount >= 10 ? "Elite Planner" : tripCount >= 5 ? "Pro Traveller" : "Traveller"}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: "Trips",        value: tripCount,              icon: "airplane-outline"          },
              { label: "Saved",        value: savedPlaces.length,     icon: "heart-outline"             },
              { label: "Member Since", value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : "—", icon: "calendar-outline" },
              { label: "Account",      value: user?.emailVerified ? "Verified" : "Unverified", icon: "checkmark-circle-outline" },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, i < 3 && styles.statCardBorder]}>
                <Ionicons name={s.icon} size={16} color={C.primary} />
                <Text style={styles.statValue} numberOfLines={1}>{String(s.value)}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity key={a.id} style={styles.quickCard} onPress={() => handleQuickAction(a.id)} activeOpacity={0.82}>
                  <View style={[styles.quickIcon, { backgroundColor: a.color + "18" }]}>
                    <Ionicons name={a.icon} size={22} color={a.color} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                  {a.id === "savedtrips" && savedPlaces.length > 0 && (
                    <View style={styles.savedCountBadge}>
                      <Text style={styles.savedCountText}>{savedPlaces.length}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={C.textSub} style={{ marginLeft: a.id === "savedtrips" && savedPlaces.length > 0 ? 4 : "auto" }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.earnedPill}>
                <Text style={styles.earnedPillText}>{earnedCount}/{achievements.length} earned</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingBottom: 4 }}>
              {achievements.map(a => (
                <View key={a.id} style={[styles.achieveCard, !a.earned && styles.achieveCardLocked]}>
                  <Text style={[styles.achieveIcon, !a.earned && { opacity: 0.3 }]}>{a.icon}</Text>
                  <Text style={[styles.achieveLabel, !a.earned && { color: C.textSub }]}>{a.label}</Text>
                  <Text style={styles.achieveDesc}>{a.desc}</Text>
                  {a.earned
                    ? <View style={styles.earnedBadge}><Ionicons name="checkmark" size={10} color="#fff" /></View>
                    : <View style={styles.lockedBadge}><Ionicons name="lock-closed" size={10} color={C.textSub} /></View>
                  }
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Travel personality */}
          <View style={styles.section}>
            <View style={styles.personalityCard}>
              <LinearGradient colors={[C.primary, "#2D9B7B"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.personalityContent}>
                <Text style={styles.personalityEyebrow}>Your Travel Style</Text>
                <Text style={styles.personalityTitle}>{personality.title}</Text>
                <Text style={styles.personalityDesc}>{personality.desc}</Text>
                <View style={styles.tripProgressWrap}>
                  <Text style={styles.tripProgressLabel}>{tripCount} trips planned</Text>
                  <View style={styles.tripProgressBar}>
                    <View style={[styles.tripProgressFill, { width: `${Math.min((tripCount / 20) * 100, 100)}%` }]} />
                  </View>
                  <Text style={styles.tripProgressSub}>20 trips = Elite Explorer</Text>
                </View>
              </View>
              <Text style={styles.personalityBg}>🌍</Text>
            </View>
          </View>

          {/* Settings groups */}
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
                        <Ionicons name={item.icon} size={17} color={C.primary} />
                      </View>
                      <View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                        {item.sub && <Text style={styles.settingSub}>{item.sub}</Text>}
                      </View>
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={prefs[item.toggleKey]}
                        onValueChange={v => setPref(item.toggleKey, v)}
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

          {/* Account info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <View style={styles.settingsCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={17} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{user?.email || "—"}</Text>
                </View>
                {user?.emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={C.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <View style={[styles.infoRow, styles.settingRowBorder]}>
                <Ionicons name="finger-print-outline" size={17} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>User ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{user?.uid || "—"}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={17} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sign out */}
          <View style={[styles.section, { paddingBottom: 50 }]}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={C.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Roamly AI Travel Planner • v1.0.0</Text>
          </View>

        </Animated.View>
      </Animated.ScrollView>

      {/* ── MODAL: Saved Trips ── */}
      <Modal visible={savedTripsVisible} transparent animationType="slide" onRequestClose={() => setSavedTripsVisible(false)}>
        <View style={styles.savedModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSavedTripsVisible(false)} />
          <View style={styles.savedModalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.savedModalHeader}>
              <Text style={styles.modalTitle}>❤️ Saved Places</Text>
              <Text style={styles.modalSub}>{savedPlaces.length} place{savedPlaces.length !== 1 ? 's' : ''} saved</Text>
            </View>

            {savedPlaces.length === 0 ? (
              <View style={styles.savedEmpty}>
                <Text style={{ fontSize: 48 }}>💔</Text>
                <Text style={styles.savedEmptyTitle}>No saved places yet</Text>
                <Text style={styles.savedEmptySub}>Tap the heart icon on any place in Discover to save it here</Text>
                <TouchableOpacity
                  style={styles.goDiscoverBtn}
                  onPress={() => { setSavedTripsVisible(false); router.push("/(tabs)/discover"); }}
                >
                  <Ionicons name="compass-outline" size={16} color="#fff" />
                  <Text style={styles.goDiscoverText}>Go to Discover</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={savedPlaces}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
                showsVerticalScrollIndicator={false}
               renderItem={({ item }) => (
  <TouchableOpacity
    style={styles.savedCard}
    activeOpacity={0.88}
    onPress={() => {
      setSavedTripsVisible(false);
      router.push({ pathname: '/TripDetails', params: { tripData: JSON.stringify(item) } });
    }}
  >
    <Image source={{ uri: item.image }} style={styles.savedCardImage} />
    {item.rating ? (
      <View style={styles.savedRatingBadge}>
        <Ionicons name="star" size={9} color="#FCD34D" />
        <Text style={styles.savedRatingText}>{item.rating.toFixed(1)}</Text>
      </View>
    ) : null}
    {/* Unsave button */}
    <TouchableOpacity
      style={styles.unsaveBtn}
     onPress={async () => {
  const updated = savedPlaces.filter(p => p.id !== item.id);
  setSavedPlaces(updated);  // updates modal instantly
  // Also sync savedIds so the count badge updates immediately
  setSavedIds && setSavedIds(new Set(updated.map(p => p.id)));
  try {
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    const currentUser = auth.currentUser;
    if (currentUser) {
      await deleteDoc(doc(db, "users", currentUser.uid, "savedPlaces", item.id));
    }
  } catch (e) { console.warn("Unsave error:", e); }
}}
    >
      <Ionicons name="heart-dislike" size={14} color="#fff" />
    </TouchableOpacity>
    <View style={styles.savedCardInfo}>
      <Text style={styles.savedCardTitle} numberOfLines={1}>{item.title}</Text>
      <View style={styles.savedCardRow}>
        <Ionicons name="location-outline" size={11} color={C.primary} />
        <Text style={styles.savedCardLocation} numberOfLines={1}>{item.location}</Text>
      </View>
    </View>
  </TouchableOpacity>
)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Avatar Picker ── */}
      <Modal visible={avatarModal} transparent animationType="slide" onRequestClose={() => setAvatarModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setAvatarModal(false)} />
          <View style={[styles.modalSheet, styles.avatarModalSheet]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Your Avatar</Text>
            <Text style={styles.modalSub}>Pick a travel avatar that represents you</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.avatarGrid} style={styles.avatarGridScroll}>
              {Array.from({ length: Math.ceil(TRAVEL_AVATARS.length / 3) }).map((_, rowIdx) => (
                <View key={rowIdx} style={styles.avatarRow}>
                  {TRAVEL_AVATARS.slice(rowIdx * 3, rowIdx * 3 + 3).map(item => {
                    const selected = selectedAvatar?.id === item.id;
                    return (
                      <TouchableOpacity key={item.id} style={[styles.avatarOption, selected && styles.avatarOptionSelected]} onPress={() => handleSelectAvatar(item)} activeOpacity={0.8}>
                        <Text style={styles.avatarOptionEmoji}>{item.emoji}</Text>
                        <Text style={[styles.avatarOptionLabel, selected && { color: C.primary }]}>{item.label}</Text>
                        {selected && <View style={styles.avatarCheckmark}><Ionicons name="checkmark-circle" size={16} color={C.primary} /></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            {selectedAvatar && (
              <TouchableOpacity style={styles.removeAvatarBtn} onPress={handleRemoveAvatar} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={16} color={C.danger} />
                <Text style={styles.removeAvatarText}>Remove Avatar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Currency Picker ── */}
      <Modal visible={currencyModal} transparent animationType="slide" onRequestClose={() => setCurrencyModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCurrencyModal(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 34 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Preferred Currency</Text>
            <Text style={styles.modalSub}>Prices across the app will reflect this currency</Text>
            <View style={[styles.settingsCard, { marginTop: 12 }]}>
              {CURRENCIES.map((c, idx) => {
                const selected = selectedCurrency.code === c.code;
                return (
                  <TouchableOpacity key={c.code} style={[styles.pickerRow, idx < CURRENCIES.length - 1 && styles.settingRowBorder, selected && styles.pickerRowSelected]} onPress={() => handleSelectCurrency(c)} activeOpacity={0.75}>
                    <View style={styles.pickerSymbolBox}><Text style={styles.pickerSymbol}>{c.symbol}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, selected && { color: C.primary }]}>{c.code}</Text>
                      <Text style={styles.settingSub}>{c.label}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Language Picker ── */}
      <Modal visible={languageModal} transparent animationType="slide" onRequestClose={() => setLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setLanguageModal(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 34 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Language</Text>
            <Text style={styles.modalSub}>Select your preferred display language</Text>
            <View style={[styles.settingsCard, { marginTop: 12 }]}>
              {LANGUAGES.map((l, idx) => {
                const selected = selectedLanguage.code === l.code;
                return (
                  <TouchableOpacity key={l.code} style={[styles.pickerRow, idx < LANGUAGES.length - 1 && styles.settingRowBorder, selected && styles.pickerRowSelected]} onPress={() => handleSelectLanguage(l)} activeOpacity={0.75}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, selected && { color: C.primary }]}>{l.label}</Text>
                      <Text style={styles.settingSub}>{l.native}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Rate the App ── */}
      <Modal visible={rateModal} transparent animationType="slide" onRequestClose={() => setRateModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setRateModal(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 34 }]}>
            <View style={styles.modalHandle} />
            {ratingSubmitted ? (
              <View style={styles.ratingThanks}>
                <Text style={styles.ratingThanksEmoji}>🎉</Text>
                <Text style={styles.ratingThanksTitle}>Thank you!</Text>
                <Text style={styles.ratingThanksSub}>Your feedback helps us improve Roamly for everyone.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Rate Roamly ⭐</Text>
                <Text style={styles.modalSub}>How's your experience with the app?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRatingStars(s)} activeOpacity={0.7}>
                      <Ionicons name={s <= ratingStars ? "star" : "star-outline"} size={40} color={s <= ratingStars ? C.accent : C.border} />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingStars > 0 && <Text style={styles.starLabel}>{["", "Poor 😞", "Fair 😐", "Good 😊", "Great 😄", "Excellent 🤩"][ratingStars]}</Text>}
                <TextInput
                  style={[styles.modalInput, { height: 88, textAlignVertical: "top", marginTop: 12 }]}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  placeholder="Tell us more (optional)..."
                  placeholderTextColor={C.textSub}
                  multiline
                  maxLength={200}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRateModal(false)}>
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalSaveBtn, ratingStars === 0 && { opacity: 0.4 }]} onPress={handleSubmitRating} disabled={ratingStars === 0}>
                    <Text style={styles.modalSaveBtnText}>Submit Rating</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Edit Name ── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <Text style={styles.modalSub}>How you'll appear across the app</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name..."
              placeholderTextColor={C.textSub}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, !editName.trim() && { opacity: 0.5 }]} onPress={handleSaveName} disabled={!editName.trim()}>
                {savingName ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText:   { color: "#fff", fontFamily: "poppins", fontSize: 14 },

  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, height: 90, justifyContent: "flex-end", paddingBottom: 14, alignItems: "center" },
  stickyName:   { fontFamily: "poppins-semi", fontSize: 16, color: "#fff" },

  hero:        { height: 300, overflow: "hidden", justifyContent: "flex-end" },
  heroContent: { alignItems: "center", paddingBottom: 28, gap: 8 },
  deco:        { position: "absolute", borderRadius: 999, backgroundColor: "#fff" },

  avatarRing:        { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: "rgba(255,255,255,0.5)", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  avatar:            { width: "100%", height: "100%", borderRadius: 50 },
  avatarEmojiWrap:   { width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  avatarEmoji:       { fontSize: 52 },
  avatarPlaceholder: { width: "100%", height: "100%", borderRadius: 50, justifyContent: "center", alignItems: "center" },
  initials:          { fontFamily: "poppins-semi", fontSize: 32, color: "#fff" },
  onlineDot:         { position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: C.success, borderWidth: 2, borderColor: "#fff" },
  editAvatarHint:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 26, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },

  heroName:        { fontFamily: "poppins-semi", fontSize: 22, color: "#fff" },
  heroEmail:       { fontFamily: "poppins", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  memberBadge:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(245,166,35,0.2)", borderWidth: 1, borderColor: "rgba(245,166,35,0.4)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  memberBadgeText: { fontFamily: "poppins-semi", fontSize: 11, color: C.accent },

  statsRow:       { flexDirection: "row", marginHorizontal: 18, marginTop: -22, backgroundColor: C.card, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, zIndex: 10 },
  statCard:       { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statCardBorder: { borderRightWidth: 1, borderRightColor: C.border },
  statValue:      { fontFamily: "poppins-semi", fontSize: 14, color: C.textMain },
  statLabel:      { fontFamily: "poppins", fontSize: 9, color: C.textSub, textAlign: "center" },

  section:       { marginTop: 20, paddingHorizontal: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:  { fontFamily: "poppins-semi", fontSize: 15, color: C.textMain, marginBottom: 12 },

  earnedPill:     { backgroundColor: C.primary + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  earnedPillText: { fontFamily: "poppins-semi", fontSize: 11, color: C.primary },

  quickGrid:       { gap: 10 },
  quickCard:       { backgroundColor: C.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  quickIcon:       { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  quickLabel:      { fontFamily: "poppins-semi", fontSize: 14, color: C.textMain, flex: 1 },
  savedCountBadge: { backgroundColor: "#E03434", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 },
  savedCountText:  { fontFamily: "poppins-semi", fontSize: 11, color: "#fff" },

  achieveCard:       { width: 116, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: "center", gap: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1.5, borderColor: C.accent + "50" },
  achieveCardLocked: { borderColor: C.border },
  achieveIcon:       { fontSize: 26 },
  achieveLabel:      { fontFamily: "poppins-semi", fontSize: 11, color: C.textMain, textAlign: "center" },
  achieveDesc:       { fontFamily: "poppins", fontSize: 9, color: C.textSub, textAlign: "center" },
  earnedBadge:       { position: "absolute", top: 8, right: 8, backgroundColor: C.success, borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center" },
  lockedBadge:       { position: "absolute", top: 8, right: 8, backgroundColor: C.bg, borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center" },

  personalityCard:    { borderRadius: 20, overflow: "hidden", height: 180 },
  personalityContent: { flex: 1, padding: 22, justifyContent: "center", zIndex: 1 },
  personalityEyebrow: { fontFamily: "poppins", fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  personalityTitle:   { fontFamily: "poppins-semi", fontSize: 19, color: "#fff", marginBottom: 4 },
  personalityDesc:    { fontFamily: "poppins", fontSize: 12, color: "rgba(255,255,255,0.8)", width: "70%", lineHeight: 18 },
  personalityBg:      { position: "absolute", right: 14, top: "50%", fontSize: 72, opacity: 0.15, transform: [{ translateY: -36 }] },
  tripProgressWrap:   { marginTop: 12 },
  tripProgressLabel:  { fontFamily: "poppins-semi", fontSize: 12, color: "#fff", marginBottom: 5 },
  tripProgressBar:    { height: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3 },
  tripProgressFill:   { height: "100%", backgroundColor: C.accent, borderRadius: 3 },
  tripProgressSub:    { fontFamily: "poppins", fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 },

  settingsCard:     { backgroundColor: C.card, borderRadius: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: "hidden" },
  settingRow:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  settingLeft:      { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconBox:   { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + "12", justifyContent: "center", alignItems: "center" },
  settingLabel:     { fontFamily: "poppins-semi", fontSize: 14, color: C.textMain },
  settingSub:       { fontFamily: "poppins", fontSize: 11, color: C.textSub, marginTop: 1 },

  infoRow:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel:     { fontFamily: "poppins", fontSize: 11, color: C.textSub },
  infoValue:     { fontFamily: "poppins-semi", fontSize: 13, color: C.textMain, marginTop: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText:  { fontFamily: "poppins-semi", fontSize: 11, color: C.success },

  logoutBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FEE2E2", borderRadius: 16, paddingVertical: 15, borderWidth: 1, borderColor: "#FECACA" },
  logoutText:  { fontFamily: "poppins-semi", fontSize: 15, color: C.danger },
  versionText: { fontFamily: "poppins", fontSize: 11, color: C.textSub, textAlign: "center", marginTop: 16 },

  // Modals base
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 14, maxHeight: "85%" },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 14 },
  modalTitle:   { fontFamily: "poppins-semi", fontSize: 20, color: C.textMain },
  modalSub:     { fontFamily: "poppins", fontSize: 13, color: C.textSub, marginBottom: 4, marginTop: 3 },
  modalInput:   { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "poppins", fontSize: 15, color: C.textMain },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalCancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  modalCancelBtnText: { fontFamily: "poppins-semi", fontSize: 15, color: "#374151" },
  modalSaveBtn:       { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: "center" },
  modalSaveBtnText:   { fontFamily: "poppins-semi", fontSize: 15, color: "#FFFFFF" },

  // Saved trips modal
  savedModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  savedModalSheet:   { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%", paddingTop: 14 },
  savedModalHeader:  { paddingHorizontal: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  savedEmpty:        { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  savedEmptyTitle:   { fontFamily: "poppins-semi", fontSize: 18, color: C.textMain },
  savedEmptySub:     { fontFamily: "poppins", fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 20 },
  goDiscoverBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  goDiscoverText:    { fontFamily: "poppins-semi", fontSize: 14, color: "#fff" },
  savedCard:         { flex: 1, backgroundColor: C.card, borderRadius: 16, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  savedCardImage:    { height: 110, width: "100%" },
  savedRatingBadge:  { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  savedRatingText:   { fontFamily: "poppins-semi", fontSize: 10, color: "#fff" },
  savedCardInfo:     { padding: 10 },
  savedCardTitle:    { fontFamily: "poppins-semi", fontSize: 12, color: C.textMain, marginBottom: 3 },
  savedCardRow:      { flexDirection: "row", alignItems: "center", gap: 3 },
  savedCardLocation: { fontFamily: "poppins", fontSize: 10, color: C.textSub, flex: 1 },
unsaveBtn: {
  position: "absolute",
  top: 8,
  right: 8,
  backgroundColor: "rgba(224,52,52,0.85)",
  padding: 6,
  borderRadius: 20,
},

  // Avatar picker
  avatarModalSheet: { paddingBottom: 24, maxHeight: "72%" },
  avatarGridScroll: { marginTop: 12 },
  avatarGrid:       { gap: 10, paddingBottom: 6 },
  avatarRow:        { flexDirection: "row", gap: 10 },
  avatarOption:         { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 12, alignItems: "center", gap: 5, borderWidth: 1.5, borderColor: "transparent" },
  avatarOptionSelected: { borderColor: C.primary, backgroundColor: C.primary + "0F" },
  avatarOptionEmoji:    { fontSize: 32 },
  avatarOptionLabel:    { fontFamily: "poppins", fontSize: 10, color: C.textSub, textAlign: "center" },
  avatarCheckmark:      { position: "absolute", top: 6, right: 6 },
  removeAvatarBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 14, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  removeAvatarText: { fontFamily: "poppins-semi", fontSize: 15, color: C.danger },

  // Picker rows
  pickerRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  pickerRowSelected: { backgroundColor: C.primary + "08" },
  pickerSymbolBox:   { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + "12", justifyContent: "center", alignItems: "center" },
  pickerSymbol:      { fontFamily: "poppins-semi", fontSize: 15, color: C.primary },

  // Rating
  starsRow:          { flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 18 },
  starLabel:         { fontFamily: "poppins-semi", fontSize: 15, color: C.textMain, textAlign: "center", marginBottom: 4 },
  ratingThanks:      { alignItems: "center", paddingVertical: 30, gap: 10 },
  ratingThanksEmoji: { fontSize: 52 },
  ratingThanksTitle: { fontFamily: "poppins-semi", fontSize: 22, color: C.textMain },
  ratingThanksSub:   { fontFamily: "poppins", fontSize: 14, color: C.textSub, textAlign: "center", lineHeight: 20 },
});
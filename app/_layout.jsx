// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import React, { useState } from "react";
// import { CreateTripContext } from "@/context/CreateTripContext";

// export default function RootLayout() {

//   useFonts({
//     'poppins':require('./../assets/fonts/Poppins-Regular.ttf'),
//     'poppins-medium':require('./../assets/fonts/Poppins-MediumItalic.ttf'),
//     'poppins-light':require('./../assets/fonts/Poppins-LightItalic.ttf'),
//     'poppins-semi':require('./../assets/fonts/Poppins-SemiBoldItalic.ttf'),
//   })


//   const [tripData,setTripData]=useState([]);
//   return (
//     <CreateTripContext.Provider value={{tripData,setTripData}}>
//       <Stack screenOptions={{
//       headerShown: false
//     }}>
//     <Stack.Screen name="(tabs)" />
//     </Stack>
//     </CreateTripContext.Provider>
    
//   );
// }



import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { CreateTripContext } from "@/context/CreateTripContext";

export default function RootLayout() {
  useFonts({
    'poppins':require('./../assets/fonts/Poppins-Regular.ttf'),
    'poppins-medium':require('./../assets/fonts/Poppins-MediumItalic.ttf'),
    'poppins-light':require('./../assets/fonts/Poppins-LightItalic.ttf'),
    'poppins-semi':require('./../assets/fonts/Poppins-SemiBoldItalic.ttf'),
  })

  const [tripData,setTripData]=useState([]);
  return (
    <CreateTripContext.Provider value={{tripData,setTripData}}>
      <Stack screenOptions={{
      headerShown: false
    }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="login" />
    <Stack.Screen name="(tabs)" />
    </Stack>
    </CreateTripContext.Provider>
  );
}
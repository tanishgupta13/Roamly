// // const {
// //   GoogleGenerativeAI,
// //   HarmCategory,
// //   HarmBlockThreshold,
// // } = require("@google/generative-ai");


// const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);
// const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// export async function generateTripPlan(promptText) {
//   try {
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: promptText }] }],
//         }),
//       }
//     );

//     const data = await response.json();

//     const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//     return outputText || "Gemini didn't return any text.";
//   } catch (error) {
//     console.error("Gemini API error:", error);
//     return "Failed to get response from Gemini.";
//   }
// }

// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash",
// });

// const generationConfig = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "application/json",
// };


//   export const chatSession = model.startChat({
//     generationConfig,
//     history: [
//       // {
//       //   role: "user",
//       //   parts: [
//       //     {text: "Generate travel plan for location: New York, NY, USA for 3 Days and 2 Night for Friends with a Moderate budget with a Flight Details,Flight Price with Booking url,Hotel options list with Hotel Name,Hotel address,price,hotel image url,geo coordinate,rating,description and places to visit nearby with place Name,place details,place image url,Geo coordinate,ticket pricing, time to travel each of the location for 3 days and 2 Night with each day plan with best time to visit in JSON format"},
//       //   ],
//       // },
//       // {
//       //   role: "model",
//       //   parts: [
//       //     {text: "```json\n{\n  \"trip\": {\n    \"destination\": \"New York, NY, USA\",\n    \"duration\": \"3 days and 2 nights\",\n    \"budget\": \"Moderate\",\n    \"travelers\": \"Friends\",\n    \"flights\": [\n      {\n        \"airline\": \"United Airlines\",\n        \"flight_number\": \"UA1234\",\n        \"departure_city\": \"Your City\",\n        \"departure_airport\": \"Your Airport Code\",\n        \"arrival_city\": \"New York\",\n        \"arrival_airport\": \"JFK\",\n        \"departure_date\": \"2024-03-01\",\n        \"departure_time\": \"10:00 AM\",\n        \"arrival_date\": \"2024-03-01\",\n        \"arrival_time\": \"1:00 PM\",\n        \"price\": \"$300\",\n        \"booking_url\": \"https://www.united.com/\"\n      }\n    ],\n    \"hotels\": [\n      {\n        \"name\": \"The Jane Hotel\",\n        \"address\": \"113 Jane St, New York, NY 10014\",\n        \"price\": \"$150-$200 per night\",\n        \"image_url\": \"https://images.trvl-media.com/media/content/hotels/2000000/1950000/1948900/1948898/363576b7_z.jpg\",\n        \"geo_coordinates\": \"40.7321,-74.0076\",\n        \"rating\": 4.0,\n        \"description\": \"A historic hotel with a unique vibe, perfect for budget-conscious travelers. Offers shared and private rooms.\",\n        \"nearby_places\": [\n          {\n            \"name\": \"The High Line\",\n            \"details\": \"Elevated park built on a former railway line. Great for walking and enjoying views.\",\n            \"image_url\": \"https://www.thehighline.org/sites/default/files/styles/full_width/public/2021-10/the-high-line-chelsea-market-sunset.jpg\",\n            \"geo_coordinates\": \"40.7484,-74.0059\",\n            \"ticket_pricing\": \"Free\",\n            \"time_to_travel\": \"15 minutes walk\"\n          },\n          {\n            \"name\": \"Chelsea Market\",\n            \"details\": \"A vibrant food hall with diverse food options and shopping.\",\n            \"image_url\": \"https://www.chelseamarket.com/wp-content/uploads/2023/03/Chelsea-Market-Drone-Shot.jpg\",\n            \"geo_coordinates\": \"40.7415,-74.0017\",\n            \"ticket_pricing\": \"Free\",\n            \"time_to_travel\": \"5 minutes walk\"\n          }\n        ]\n      },\n      {\n        \"name\": \"The Pod 51\",\n        \"address\": \"230 E 51st St, New York, NY 10022\",\n        \"price\": \"$175-$250 per night\",\n        \"image_url\": \"https://media.nomadicmatt.com/wp-content/uploads/2017/08/Pod-51-Hotel-NYC-Review-1.jpg\",\n        \"geo_coordinates\": \"40.7569,-73.9725\",\n        \"rating\": 3.5,\n        \"description\": \"Modern hotel with compact rooms, ideal for a city exploration base. Offers shared and private rooms.\",\n        \"nearby_places\": [\n          {\n            \"name\": \"Grand Central Terminal\",\n            \"details\": \"Iconic transportation hub with stunning architecture and a food court.\",\n            \"image_url\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grand_Central_Terminal_Interior_2012_08_24.jpg/1200px-Grand_Central_Terminal_Interior_2012_08_24.jpg\",\n            \"geo_coordinates\": \"40.7527,-73.9772\",\n            \"ticket_pricing\": \"Free\",\n            \"time_to_travel\": \"10 minutes walk\"\n          },\n          {\n            \"name\": \"Chrysler Building\",\n            \"details\": \"Art Deco skyscraper known for its distinctive spire.\",\n            \"image_url\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Chrysler_Building_Exterior_2012.jpg/1200px-Chrysler_Building_Exterior_2012.jpg\",\n            \"geo_coordinates\": \"40.7577,-73.9726\",\n            \"ticket_pricing\": \"Free\",\n            \"time_to_travel\": \"5 minutes walk\"\n          }\n        ]\n      },\n      {\n        \"name\": \"The Time New York\",\n        \"address\": \"224 W 49th St, New York, NY 10019\",\n        \"price\": \"$250-$350 per night\",\n        \"image_url\": \"https://media.nomadicmatt.com/wp-content/uploads/2015/02/Time-New-York-Hotel-Review-1.jpg\",\n        \"geo_coordinates\": \"40.7604,-73.9858\",\n        \"rating\": 4.5,\n        \"description\": \"Stylish hotel with a rooftop bar offering stunning views of the city. Offers various room types.\",\n        \"nearby_places\": [\n          {\n            \"name\": \"Times Square\",\n            \"details\": \"Famous entertainment district with bright lights and Broadway shows.\",\n            \"image_url\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Times_Square_at_Night_2011.jpg/1280px-Times_Square_at_Night_2011.jpg\",\n            \"geo_coordinates\": \"40.7580,-73.9855\",\n            \"ticket_pricing\": \"Free\",\n            \"time_to_travel\": \"5 minutes walk\"\n          },\n          {\n            \"name\": \"Radio City Music Hall\",\n            \"details\": \"Iconic theater hosting various shows and events.\",\n            \"image_url\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Radio_City_Music_Hall_2016.jpg/1280px-Radio_City_Music_Hall_2016.jpg\",\n            \"geo_coordinates\": \"40.7577,-73.9802\",\n            \"ticket_pricing\": \"Varies based on show\",\n            \"time_to_travel\": \"10 minutes walk\"\n          }\n        ]\n      }\n    ],\n    \"itinerary\": [\n      {\n        \"day\": \"Day 1\",\n        \"time\": \"Morning\",\n        \"activity\": \"Explore Central Park\",\n        \"details\": \"Enjoy a stroll, bike ride, or picnic in the iconic park. Visit the Bethesda Terrace and Strawberry Fields.\",\n        \"time_to_spend\": \"3 hours\",\n        \"best_time_to_visit\": \"Anytime of day, especially during spring and fall for pleasant weather\"\n      },\n      {\n        \"day\": \"Day 1\",\n        \"time\": \"Afternoon\",\n        \"activity\": \"Lunch at a Food Truck in Midtown\",\n        \"details\": \"Experience a diverse range of food options from street food vendors in Midtown.\",\n        \"time_to_spend\": \"1 hour\",\n        \"best_time_to_visit\": \"Lunchtime (12-2 PM)\"\n      },\n      {\n        \"day\": \"Day 1\",\n        \"time\": \"Evening\",\n        \"activity\": \"Visit the Museum of Modern Art (MoMA)\",\n        \"details\": \"Immerse yourselves in the world of modern and contemporary art.\",\n        \"time_to_spend\": \"2 hours\",\n        \"best_time_to_visit\": \"Afternoons and evenings, avoid weekends for less crowds\"\n      },\n      {\n        \"day\": \"Day 2\",\n        \"time\": \"Morning\",\n        \"activity\": \"Visit the Statue of Liberty and Ellis Island\",\n        \"details\": \"Take a ferry to see the iconic Statue of Liberty and learn about the history of immigration at Ellis Island.\",\n        \"time_to_spend\": \"4 hours\",\n        \"best_time_to_visit\": \"Morning for less crowds, book ferry tickets in advance\"\n      },\n      {\n        \"day\": \"Day 2\",\n        \"time\": \"Afternoon\",\n        \"activity\": \"Walk across the Brooklyn Bridge\",\n        \"details\": \"Enjoy a scenic walk across the iconic bridge with stunning views of the city.\",\n        \"time_to_spend\": \"2 hours\",\n        \"best_time_to_visit\": \"Afternoon or evening for sunset views\"\n      },\n      {\n        \"day\": \"Day 2\",\n        \"time\": \"Evening\",\n        \"activity\": \"Dinner in Little Italy\",\n        \"details\": \"Enjoy authentic Italian cuisine in the vibrant neighborhood of Little Italy.\",\n        \"time_to_spend\": \"2 hours\",\n        \"best_time_to_visit\": \"Dinner time (6-9 PM)\"\n      },\n      {\n        \"day\": \"Day 3\",\n        \"time\": \"Morning\",\n        \"activity\": \"Explore the Lower East Side\",\n        \"details\": \"Discover the trendy shops, art galleries, and street art in the Lower East Side.\",\n        \"time_to_spend\": \"3 hours\",\n        \"best_time_to_visit\": \"Anytime during the day, weekends offer a more lively atmosphere\"\n      },\n      {\n        \"day\": \"Day 3\",\n        \"time\": \"Afternoon\",\n        \"activity\": \"Visit the Empire State Building\",\n        \"details\": \"Ascend to the observation deck for panoramic views of New York City.\",\n        \"time_to_spend\": \"2 hours\",\n        \"best_time_to_visit\": \"Afternoon for best light, buy tickets online in advance\"\n      },\n      {\n        \"day\": \"Day 3\",\n        \"time\": \"Evening\",\n        \"activity\": \"Enjoy a Broadway show\",\n        \"details\": \"Experience the magic of a Broadway production in Times Square.\",\n        \"time_to_spend\": \"3 hours\",\n        \"best_time_to_visit\": \"Evening for evening performances, book tickets online in advance\"\n      }\n    ]\n  }\n}\n```\n\n**Please note:**\n\n* This itinerary is a suggestion, feel free to customize it based on your interests and preferences.\n* Flight prices are approximate and may vary depending on the time of year and availability.\n* Hotel prices are based on average rates and may also fluctuate.\n* This plan is designed for a moderate budget, you can adjust hotel and activity choices for a different budget.\n*  You can explore more places to visit in New York on websites like TripAdvisor, Time Out New York, and NYC The Official Guide. \n"},
//       //   ],
//       // },
//       {
//         role: "user",
//         parts: [
//           {text: "Generate travel plan for location: New York, NY, USA for 3 Days and 2 Night for Friends with a Moderate budget with a Flight Details,Flight Price with Booking url,Hotel options list with Hotel Name,Hotel address,price,hotel image url,geo coordinate,rating,description and places to visit nearby with place Name,place details,place image url,Geo coordinate,ticket pricing, time to travel each of the location for 3 days and 2 Night with each day plan with best time to visit in JSON format\n"},
//         ],
//       },
//       {
//         role: "model",
//         parts: [
//           {text: "I cannot provide real-time flight and hotel prices, booking URLs, or image URLs.  These are dynamic and change constantly.  My role is to give you a structured framework for your trip planning. You'll need to use online travel agencies (like Expedia, Kayak, Booking.com) to find current prices and book your travel.\n\nHere's a JSON representation of a possible 3-day, 2-night New York City itinerary for friends on a moderate budget.  Remember to fill in the missing dynamic data yourself.\n\n```json\n{\n  \"tripName\": \"NYC Getaway for Friends\",\n  \"duration\": \"3 Days, 2 Nights\",\n  \"budget\": \"Moderate\",\n  \"travelers\": \"Friends\",\n  \"flights\": [\n    {\n      \"airline\": \"FILL IN AIRLINE\",\n      \"flightNumber\": \"FILL IN FLIGHT NUMBER\",\n      \"departureAirport\": \"FILL IN DEPARTURE AIRPORT\",\n      \"arrivalAirport\": \"JFK/LGA/EWR (NYC)\",\n      \"departureTime\": \"FILL IN DEPARTURE TIME\",\n      \"arrivalTime\": \"FILL IN ARRIVAL TIME\",\n      \"price\": \"FILL IN PRICE\",\n      \"bookingUrl\": \"FILL IN BOOKING URL\" \n    },\n    {\n      \"airline\": \"FILL IN AIRLINE\",\n      \"flightNumber\": \"FILL IN FLIGHT NUMBER\",\n      \"departureAirport\": \"JFK/LGA/EWR (NYC)\",\n      \"arrivalAirport\": \"FILL IN RETURN AIRPORT\",\n      \"departureTime\": \"FILL IN DEPARTURE TIME\",\n      \"arrivalTime\": \"FILL IN ARRIVAL TIME\",\n      \"price\": \"FILL IN PRICE\",\n      \"bookingUrl\": \"FILL IN BOOKING URL\"\n    }\n  ],\n  \"hotels\": [\n    {\n      \"hotelName\": \"FILL IN HOTEL NAME\",\n      \"address\": \"FILL IN HOTEL ADDRESS\",\n      \"pricePerNight\": \"FILL IN PRICE\",\n      \"imageUrl\": \"FILL IN IMAGE URL\",\n      \"geoCoordinate\": \"FILL IN GEO COORDINATE (latitude, longitude)\",\n      \"rating\": \"FILL IN RATING (e.g., 4.5)\",\n      \"description\": \"FILL IN HOTEL DESCRIPTION\",\n      \"nearbyPlaces\": [\n         // Add nearby attractions here (see example below)\n      ]\n    }\n    // Add more hotel options here if needed\n  ],\n  \"itinerary\": {\n    \"day1\": {\n      \"theme\": \"Downtown Exploration\",\n      \"morning\": {\n        \"activity\": \"Visit the Statue of Liberty & Ellis Island\",\n        \"details\": \"Ferry to Liberty Island, explore the museum, see the statue.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"FILL IN TICKET PRICE\",\n        \"travelTime\": \"2-3 hours (including ferry travel)\"\n      },\n      \"afternoon\": {\n        \"activity\": \"Walk through the Financial District\",\n        \"details\": \"See Wall Street, Charging Bull, 9/11 Memorial & Museum.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"FILL IN TICKET PRICE (Museum)\",\n        \"travelTime\": \"3-4 hours\"\n      },\n      \"evening\": {\n        \"activity\": \"Dinner in Little Italy/Chinatown\",\n        \"details\": \"Enjoy authentic Italian or Chinese food.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"Varies\",\n        \"travelTime\": \"Flexible\"\n      }\n    },\n    \"day2\": {\n      \"theme\": \"Midtown Marvels & Culture\",\n      \"morning\": {\n        \"activity\": \"Times Square & Broadway\",\n        \"details\": \"Experience the bright lights of Times Square, consider a Broadway show.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"Varies (Broadway shows)\",\n        \"travelTime\": \"3-4 hours\"\n      },\n      \"afternoon\": {\n        \"activity\": \"Visit Central Park\",\n        \"details\": \"Walk, bike, or have a picnic in Central Park.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"Free\",\n        \"travelTime\": \"2-4 hours\"\n      },\n      \"evening\": {\n        \"activity\": \"Museum visit (MoMA or Met)\",\n        \"details\": \"Choose a museum based on your interests.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"FILL IN TICKET PRICE\",\n        \"travelTime\": \"2-3 hours\"\n      }\n    },\n    \"day3\": {\n      \"theme\": \"Departure\",\n      \"morning\": {\n        \"activity\": \"Last-minute souvenir shopping\",\n        \"details\": \"Explore shops near your hotel or in a specific area.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"Varies\",\n        \"travelTime\": \"Flexible\"\n      },\n      \"afternoon\": {\n        \"activity\": \"Travel to airport for departure\",\n        \"details\": \"Allow ample time for travel to the airport.\",\n        \"imageUrl\": \"FILL IN IMAGE URL\",\n        \"geoCoordinate\": \"FILL IN GEO COORDINATE\",\n        \"ticketPricing\": \"Transportation costs\",\n        \"travelTime\": \"Varies depending on location and traffic\"\n      }\n    }\n  }\n}\n```\n\n\nRemember to replace the \"FILL IN\" placeholders with actual information using online travel booking sites.  You can also customize this itinerary to better suit your preferences and interests.  Consider adding specific restaurant recommendations and adjusting the time allocations based on your group's pace.\n"},
//         ],
//       },
//     ],
//   });

//   // const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
//   // console.log(result.response.text());


// //2nd version below
// const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// export const chatSession = {
//   sendMessage: async (prompt) => {
//     try {
//       if (!API_KEY) {
//         throw new Error('EXPO_PUBLIC_GEMINI_KEY is not configured');
//       }

//       const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text: prompt }] }],
//             generationConfig: {
//               temperature: 0.7, // Reduced for more consistent JSON output
//               topP: 0.8,
//               topK: 40,
//               maxOutputTokens: 8192,
//             }
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`HTTP ${response.status}: ${errorText}`);
//       }

//       const data = await response.json();
      
//       // Check for API errors
//       if (data.error) {
//         throw new Error(`Gemini API error: ${data.error.message}`);
//       }

//       // Validate response structure
//       if (!data.candidates || data.candidates.length === 0) {
//         throw new Error('No candidates returned from Gemini API');
//       }

//       const candidate = data.candidates[0];
//       if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
//         throw new Error('Invalid response structure from Gemini API');
//       }

//       return {
//         response: {
//           candidates: data.candidates
//         }
//       };
//     } catch (error) {
//       console.error("Gemini API error:", error);
//       throw error;
//     }
//   }
// };

// export async function generateTripPlan(promptText) {
//   try {
//     if (!API_KEY) {
//       throw new Error('EXPO_PUBLIC_GEMINI_KEY is not configured');
//     }

//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: promptText }] }],
//           generationConfig: {
//             temperature: 0.7,
//             topP: 0.8,
//             topK: 40,
//             maxOutputTokens: 8192,
//           }
//         }),
//       }
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP ${response.status}: ${errorText}`);
//     }

//     const data = await response.json();
    
//     if (data.error) {
//       throw new Error(`Gemini API error: ${data.error.message}`);
//     }

//     const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//     return outputText || "Gemini didn't return any text.";
//   } catch (error) {
//     console.error("Gemini API error:", error);
//     throw error;
//   }
// }


const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const MODEL = "gemini-2.5-flash";  // change this to a currently supported model
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

export const chatSession = {
  sendMessage: async (prompt) => {
    try {
      if (!API_KEY) {
        throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      if (!data.candidates?.length) {
        throw new Error("No candidates returned from Gemini API");
      }

      return {
        response: {
          candidates: data.candidates,
        },
      };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  },
};

export async function generateTripPlan(promptText) {
  try {
    if (!API_KEY) {
      throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return outputText || "Gemini didn't return any text.";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

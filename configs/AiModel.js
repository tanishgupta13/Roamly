// const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// // 1. We put your correct 2.5 model back!
// const MODEL = "gemini-2.5-flash"; 

// // 2. We keep v1beta so it accepts the strict JSON formatting rule
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
// const STRICT_JSON_RULE = `
// CRITICAL SYSTEM INSTRUCTION: You MUST return ONLY a valid JSON object. 
// The JSON object MUST contain a key named exactly "itinerary". 
// The value of "itinerary" MUST be an array of daily plan objects. 
// Do not use "daily_plan", "schedule", or any other name. Do not wrap the JSON in markdown formatting.
// `;

// export const chatSession = {
//   sendMessage: async (prompt) => {
//     try {
//       if (!API_KEY) {
//         throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
//       }

//       const finalPrompt = prompt + STRICT_JSON_RULE;

//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
//           generationConfig: {
//             temperature: 0.7,
//             topP: 0.8,
//             topK: 40,
//             maxOutputTokens: 8192,
//             responseMimeType: "application/json", // Works perfectly in v1beta!
//           },
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`HTTP ${response.status}: ${errorText}`);
//       }

//       const data = await response.json();

//       if (data.error) {
//         throw new Error(`Gemini API error: ${data.error.message}`);
//       }

//       if (!data.candidates?.length) {
//         throw new Error("No candidates returned from Gemini API");
//       }

//       return {
//         response: {
//           candidates: data.candidates,
//         },
//       };
//     } catch (error) {
//       console.error("Gemini API error:", error);
//       throw error;
//     }
//   },
// };

// export async function generateTripPlan(promptText) {
//   try {
//     if (!API_KEY) {
//       throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
//     }

//     const finalPrompt = promptText + STRICT_JSON_RULE;

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
//         generationConfig: {
//           temperature: 0.7,
//           topP: 0.8,
//           topK: 40,
//           maxOutputTokens: 8192,
//           responseMimeType: "application/json", // Works perfectly in v1beta!
//         },
//       }),
//     });

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
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Pass userLocation as { city, country } e.g. { city: "Pune", country: "India" }
export function buildTripPrompt(destination, tripDetails, userLocation = null) {
  const origin = userLocation
    ? `${userLocation.city}, ${userLocation.country}`
    : "the user's current location";

  return `
Generate a complete travel plan for a trip FROM ${origin} TO ${destination}.

Trip details:
- Travelers: ${tripDetails.traveler}
- Duration: ${tripDetails.duration}
- Budget: ${tripDetails.budget}
- Start date: ${tripDetails.startDate}

CRITICAL JSON RULES — you MUST follow these exactly:
1. Return ONLY a valid JSON object, no markdown, no backticks.
2. The root object MUST have a key called exactly "itinerary".
3. "itinerary" MUST be an array of day objects.
4. Each day object MUST have these exact keys:
   - "day": string like "Day 1"
   - "theme": short string describing the day's focus
   - "activities": array of activity objects

5. Each activity object MUST have these exact keys:
   - "time_slot": one of "Morning", "Afternoon", "Evening", "Night"
   - "activity": detailed description of the activity (2-3 sentences)
   - "ticket_pricing": pricing string like "₹500 per person" or "Free" — NEVER null
   - "time_to_travel": travel time string like "30 mins by metro" — NEVER null
   - "geo_coordinate": object with "latitude" and "longitude" as numbers

6. Include FOOD in the itinerary:
   - Every day MUST have at least one meal activity (breakfast, lunch, or dinner)
   - Meal activities MUST include estimated food cost in "ticket_pricing" 
     e.g. "₹300-500 per person for a local meal"

7. Also include at root level:
   - "flight_details": { flight_name, flight_price_inr, booking_url }
     — flights MUST depart from ${origin}
   - "hotel_options": array of 3 hotels with name, address, price_per_night_inr, 
     geo_coordinates (lat,lng string), rating, description
   - "places_to_visit_nearby": array of 4 places with place_name, place_details,
     geo_coordinate (lat,lng string), ticket_pricing_inr, time_to_travel
   - "duration": "${tripDetails.duration}"
   - "budget": "${tripDetails.budget}"
   - "bestTimeToVisit": best season string

Example activity structure:
{
  "time_slot": "Morning",
  "activity": "Visit the famous XYZ temple. Take a guided tour of the ancient halls. Photography is allowed in the outer courtyard.",
  "ticket_pricing": "₹200 per person entry fee",
  "time_to_travel": "20 mins by auto from hotel",
  "geo_coordinate": { "latitude": 18.5204, "longitude": 73.8567 }
}

Example meal activity:
{
  "time_slot": "Afternoon",
  "activity": "Lunch at a local restaurant. Try the regional thali which includes rice, dal, and local curries. Vegetarian and non-vegetarian options available.",
  "ticket_pricing": "₹250-400 per person",
  "time_to_travel": "5 mins walk from previous location",
  "geo_coordinate": { "latitude": 18.5210, "longitude": 73.8570 }
}
`;
}

const STRICT_JSON_RULE = `
CRITICAL SYSTEM INSTRUCTION: Return ONLY valid JSON. No markdown. No backticks. 
The JSON MUST contain "itinerary" as an array. 
Every activity MUST be an object with time_slot, activity, ticket_pricing, time_to_travel, geo_coordinate.
ticket_pricing and time_to_travel must NEVER be null — always provide an estimate.
`;

export const chatSession = {
  sendMessage: async (prompt) => {
    try {
      if (!API_KEY) throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
      const finalPrompt = prompt + STRICT_JSON_RULE;
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(`Gemini API error: ${data.error.message}`);
      if (!data.candidates?.length) throw new Error("No candidates returned");
      return { response: { candidates: data.candidates } };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  },
};

export async function generateTripPlan(promptText) {
  try {
    if (!API_KEY) throw new Error("EXPO_PUBLIC_GEMINI_KEY is not configured");
    const finalPrompt = promptText + STRICT_JSON_RULE;
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(`Gemini API error: ${data.error.message}`);
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return outputText || "Gemini didn't return any text.";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}
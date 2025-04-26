// src/lib/api.ts
import axios from 'axios';

export const fetchPropertyData = async (address: string) => {
  try {
    const res = await axios.get('https://api.example.com/zillow-endpoint', { // Replace with actual RapidAPI endpoint
      headers: {
        'x-rapidapi-key': process.env.ZILLOW_API_KEY, // Make sure to set this in your .env file
        'x-rapidapi-host': 'zillow-endpoint.com', // Replace with actual host
      },
      params: {
        address: address,
      }
    });

    return res.data;
  } catch (error) {
    console.error("Error fetching property data:", error);
    return null;
  }
};

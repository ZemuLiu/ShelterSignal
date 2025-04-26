// frontend/pages/api/property.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';
import type { PropertyData, ApiErrorResponse } from '@/types'; // Adjust path if needed

// Ensure your Python backend URL is configurable, but localhost is fine for dev
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8001/property';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PropertyData | ApiErrorResponse> // Type the response
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { address } = req.query;

  // Validate input
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return res.status(400).json({ message: 'Address query parameter is required and cannot be empty.' });
  }

  console.log(`[API Route] Fetching data for address: ${address}`); // Server-side log

  try {
    // Call the Python backend
    const backendResponse = await axios.get<PropertyData>(BACKEND_API_URL, {
      params: {
        // Ensure the backend expects the parameter named 'address'
        address: address.trim(),
        // Add any other parameters your backend needs, e.g., postal_code if separate
      },
      timeout: 15000, // Set a reasonable timeout (e.g., 15 seconds)
    });

    // Check if the backend returned valid data (you might add more checks)
    if (backendResponse.status === 200 && backendResponse.data) {
       console.log(`[API Route] Successfully fetched data from backend for: ${address}`);
       // Return the data received from the backend directly
       return res.status(200).json(backendResponse.data);
    } else {
       // Handle unexpected success status or empty data from backend
       console.warn(`[API Route] Received status ${backendResponse.status} or empty data from backend for: ${address}`);
       return res.status(500).json({ message: 'Received invalid response from backend service.' });
    }

  } catch (error) {
    console.error("[API Route] Error calling backend:", error);

    // Handle specific Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // If the backend provided a specific error message, forward it
      const backendMessage = axiosError.response?.data?.message;
      const status = axiosError.response?.status || 500;
      return res.status(status).json({ message: backendMessage || axiosError.message || 'Error fetching data from backend service.' });
    }

    // Handle generic errors
    return res.status(500).json({ message: 'An unexpected error occurred while fetching property data.' });
  }
}
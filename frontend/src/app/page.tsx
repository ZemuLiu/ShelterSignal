// frontend/src/app/page.tsx
"use client";

import { useState } from "react";
import axios, { AxiosError } from 'axios';
import SearchBar from "@/components/searchbar";
import InsightsDashboard from "@/components/insightsdashboard";
import { PropertyData, ApiErrorResponse } from "@/types"; // Adjust path if needed
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react"; // Import AlertCircle

const HomePage = () => {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundError, setIsNotFoundError] = useState<boolean>(false); // State for specific 404

  const handleSearchSubmit = async (address: string) => {
    console.log("Search submitted for:", address);
    setIsLoading(true);
    setError(null);
    setIsNotFoundError(false); // Reset not found state
    setPropertyData(null);

    try {
      // Make the API call to our Next.js API route
      const response = await axios.get<PropertyData>(`/api/property`, {
        params: { address },
      });

      // Check if data is received successfully
      if (response.data) {
        setPropertyData(response.data);
        console.log("Data received:", response.data);
      } else {
         // Should ideally not happen if API route handles errors, but good practice
         throw new Error("Received empty data from server.");
      }

    } catch (err: unknown) {
      console.error("Error fetching property data:", err); // Log the full error

      let errorMessage = "An unexpected error occurred. Please try again later.";
      setIsNotFoundError(false); // Default to not a 404 error

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        // --- Check for 404 specifically ---
        if (axiosError.response?.status === 404) {
          errorMessage = axiosError.response?.data?.message || "No data found for the specified address. Please check the address and try again.";
          setIsNotFoundError(true); // Mark as a 'not found' error
        } else {
          // Use message from API response if available (for 500s, 400s etc.)
          errorMessage = axiosError.response?.data?.message || axiosError.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage); // Set the error message state
      setPropertyData(null); // Ensure no stale data is shown on error

    } finally {
      setIsLoading(false); // Set loading state back to false regardless of success/failure
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 bg-gradient-to-b from-sky-50 to-gray-100"> {/* Example gradient background */}
      {/* Header Section */}
      <div className="text-center mb-8">
         {/* You could add a logo here */}
         <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
           ShelterSignal
         </h1>
         <p className="text-lg text-gray-600 mt-2">
           Get Instant Property Insights & Future Price Predictions
         </p>
      </div>

      {/* Search Bar Section */}
      <SearchBar onSubmit={handleSearchSubmit} isLoading={isLoading} className="mb-6" />

      {/* Error Display Section */}
      {error && !isLoading && (
         // Use a different variant/icon for 'Not Found' vs 'System Error'
         <Alert variant={isNotFoundError ? "default" : "destructive"} className="w-full max-w-4xl mt-4 border">
           {isNotFoundError ? <AlertCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
           <AlertTitle>{isNotFoundError ? "Information" : "Search Failed"}</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {/* Dashboard Section - Renders loading skeleton or data */}
      {/* Only render dashboard if data exists and not loading */}
      {propertyData && !isLoading && <InsightsDashboard data={propertyData} isLoading={isLoading} />}
      {/* Do not render dashboard if loading or if there was an error */}

    </div>
  );
};

export default HomePage;
// frontend/src/app/page.tsx
"use client"; // This page needs client-side interactivity (state, effects)

import { useState } from "react";
import axios, { AxiosError } from 'axios'; // Use axios or fetch for API calls
import SearchBar from "@/components/searchbar"; // Import SearchBar component
import InsightsDashboard from "@/components/insightsdashboard"; // Import Dashboard component
import { PropertyData, ApiErrorResponse } from "@/types"; // Import custom types

// Import shadcn components for UI feedback
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import icons from lucide-react
import { Terminal, AlertCircle, Search } from "lucide-react";

const HomePage = () => {
  // State for the fetched property data
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  // State to track loading status during API call
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to store any error messages during API call
  const [error, setError] = useState<string | null>(null);
  // State to specifically track if the error was a 'Not Found' (404)
  const [isNotFoundError, setIsNotFoundError] = useState<boolean>(false);

  // Function triggered by SearchBar's onSubmit prop
  const handleSearchSubmit = async (address: string) => {
    console.log("Search submitted for:", address); // Client-side log for debugging
    setIsLoading(true); // Set loading state to true - triggers UI changes (e.g., disable button, show skeleton)
    setError(null); // Clear any previous errors
    setIsNotFoundError(false); // Reset 'not found' state for new search
    setPropertyData(null); // Clear previous results immediately

    try {
      // Make the API call to our backend API endpoint
      // Using a RELATIVE PATH - Vercel will route this to backend/main.py via vercel.json
      const response = await axios.get<PropertyData>(`/api/property`, {
        params: { address }, // Pass address as query parameter
        timeout: 30000 // Set a longer timeout (30 seconds) for potentially slow AI calls
      });

      // Check if data is received successfully in the response
      if (response.data) {
        setPropertyData(response.data); // Update state with fetched data
        console.log("Data received:", response.data); // Client-side log for debugging
      } else {
         // This case should ideally not happen if the backend API route handles errors properly,
         // but it's good practice to have a fallback.
         throw new Error("Received empty data from server.");
      }

    } catch (err: unknown) {
      console.error("Error fetching property data:", err); // Log the full error for debugging

      let errorMessage = "An unexpected error occurred. Please try again later."; // Default error message
      setIsNotFoundError(false); // Default to not a 404 error

      // Check if the error is an Axios error to access response details
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>; // Type assertion for better access

        // --- Check specifically for 404 Not Found status ---
        if (axiosError.response?.status === 404) {
          // Use the specific message from the backend if available, otherwise use a user-friendly default
          errorMessage = axiosError.response?.data?.message || "No data found for the specified address. Please check the address and try again.";
          setIsNotFoundError(true); // Mark this as a 'not found' error for specific UI handling
        } else {
          // For other errors (500, 400, network errors etc.), use the message from the API response if available
          errorMessage = axiosError.response?.data?.message || axiosError.message;
        }
      } else if (err instanceof Error) {
        // Handle non-Axios errors (e.g., network issues before request is sent)
        errorMessage = err.message;
      }

      setError(errorMessage); // Set the error message state to display in the UI
      setPropertyData(null); // Ensure no stale data is shown on error

    } finally {
      // This block executes regardless of whether the try block succeeded or failed
      setIsLoading(false); // Set loading state back to false to re-enable UI elements
    }
  };

  // Render the main page component
  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 bg-gradient-to-b from-sky-100 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="text-center mb-8 px-4">
         {/* Consider adding a logo image here */}
         {/* <img src="/logo.png" alt="ShelterSignal Logo" className="h-12 mx-auto mb-2"/> */}
         <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">
           ShelterSignal
         </h1>
         <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
           Enter a property address to get instant insights, market analysis, future predictions, and an AI-generated investment brief.
         </p>
      </div>

      {/* Search Bar Section */}
      {/* Pass the submit handler and loading state to the SearchBar component */}
      <SearchBar onSubmit={handleSearchSubmit} isLoading={isLoading} className="mb-6 w-full max-w-2xl px-4" />

      {/* Error Display Section */}
      {/* Conditionally render the Alert component if there's an error and not currently loading */}
      {error && !isLoading && (
         // Use a different visual style (variant) and icon based on whether it was a 'Not Found' error
         <Alert
            variant={isNotFoundError ? "default" : "destructive"} // 'default' (blue/gray) for 404, 'destructive' (red) for others
            className="w-full max-w-4xl mt-4 border dark:border-gray-700 dark:bg-gray-800"
         >
           {isNotFoundError ? <AlertCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />} {/* Different icons */}
           <AlertTitle className={isNotFoundError ? "dark:text-blue-300" : "dark:text-red-400"}>
             {isNotFoundError ? "Information" : "Search Failed"} {/* Different titles */}
           </AlertTitle>
           <AlertDescription className={isNotFoundError ? "dark:text-gray-300" : "dark:text-red-300"}>
             {error} {/* Display the specific error message */}
           </AlertDescription>
         </Alert>
      )}

      {/* Dashboard Section - Renders loading skeleton or data */}
      {/* Conditionally render the InsightsDashboard only if data exists and we are not loading */}
      {/* The dashboard component itself handles the loading skeleton internally */}
      <InsightsDashboard data={propertyData} isLoading={isLoading} />
      {/* Note: We don't render the dashboard if there was an error, the error alert handles that state */}

    </div>
  );
};

export default HomePage;
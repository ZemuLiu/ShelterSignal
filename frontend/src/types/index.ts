// frontend/src/types/index.ts

export interface HistoricalValue {
    date: string; // "YYYY-MM-DD"
    value: number;
  }
  
  // --- NEW: Prediction Point Type ---
  export interface PredictionPoint {
      date: string; // "YYYY-MM-DD" for future date
      value: number; // Predicted value for that date
  }
  
  // Census Data Type
  export interface CensusData {
    totalPopulation?: number | null;
    malePopulation?: number | null;
    femalePopulation?: number | null;
    medianAge?: number | null;
  }
  
  // Main Property Data Structure
  export interface PropertyData {
    // Rentcast Fields
    id?: string | null;
    address?: string | null;
    formattedAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    squareFootage?: number | null;
    lotSize?: number | null;
    yearBuilt?: number | null;
    propertyType?: string | null;
    description?: string | null;
    valueEstimate?: number | null;
    valueEstimateLow?: number | null;
    valueEstimateHigh?: number | null;
    rentEstimate?: number | null;
    rentEstimateLow?: number | null;
    rentEstimateHigh?: number | null;
    lastSoldDate?: string | null;
    lastSoldPrice?: number | null;
    zipCode?: string | null;
  
    // ML & History
    predictedValueNextYear?: number | null; // Single value for display cards
    predictionConfidence?: number | null;
    predictedRentNextYear?: number | null;
    marketTrend?: 'Increasing' | 'Decreasing' | 'Stable' | 'Unknown' | 'Error' | null; // Added Unknown/Error
    trendConfidence?: number | null;
    historicalValues?: HistoricalValue[] | null;
    // --- NEW: Prediction Points for Chart ---
    predictionPoints?: PredictionPoint[] | null;
  
    // Census Data
    censusData?: CensusData | null;
  
    // AI Summary Field
    aiSummary?: string | null;
  }
  
  // API Error Response Structure
  export interface ApiErrorResponse {
    message: string;
  }
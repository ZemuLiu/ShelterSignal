# backend/main.py

import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import traceback

# --- Load environment variables ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.info(f"DEBUG: RENTCAST_API_KEY loaded: {'Yes' if os.getenv('RENTCAST_API_KEY') else 'NO'}")
logging.info(f"DEBUG: CENSUS_API_KEY loaded: {'Yes' if os.getenv('CENSUS_API_KEY') else 'NO'}")
logging.info(f"DEBUG: GEMINI_API_KEY loaded: {'Yes' if os.getenv('GEMINI_API_KEY') else 'NO'}")


# --- Import Services ---
from services.rentcast_service import get_property_info
from services.census_service import fetch_demographic_data
# --- Import the ML numerical prediction service ---
from services.ml_service import generate_numerical_predictions
# --- Import the NEW Gemini service ---
from services.gemini_service import get_ai_summary
# --- Add imports for actual History service when ready ---

app = FastAPI(
    title="ShelterSignal API",
    description="Provides property insights using Rentcast, Census, ML predictions and AI-generated summaries.",
    version="0.3.0" # Incremented version
)

# --- CORS Middleware ---
origins = [
    "http://localhost:3000",
    # Add your Vercel deployment URL(s) here when known
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- Pydantic Models ---
class HistoricalValue(BaseModel):
    date: str
    value: float

# --- NEW: Prediction Point Model ---
class PredictionPoint(BaseModel):
    date: str # Date for the prediction point (e.g., "YYYY-MM-DD")
    value: float # Predicted value

class CensusData(BaseModel):
    totalPopulation: Optional[int] = Field(None, alias='DP05_0001E')
    malePopulation: Optional[int] = Field(None, alias='DP05_0002E')
    femalePopulation: Optional[int] = Field(None, alias='DP05_0003E')
    medianAge: Optional[float] = Field(None, alias='DP05_0018E')
    class Config:
        populate_by_name = True

class PropertyDataResponse(BaseModel):
    # Rentcast Fields...
    id: Optional[str] = None
    address: Optional[str] = None
    formattedAddress: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    squareFootage: Optional[int] = None
    lotSize: Optional[int] = None
    yearBuilt: Optional[int] = None
    propertyType: Optional[str] = None
    description: Optional[str] = None
    valueEstimate: Optional[float] = None
    valueEstimateLow: Optional[float] = None
    valueEstimateHigh: Optional[float] = None
    rentEstimate: Optional[float] = None
    rentEstimateLow: Optional[float] = None
    rentEstimateHigh: Optional[float] = None
    lastSoldDate: Optional[str] = None
    lastSoldPrice: Optional[float] = None
    zipCode: Optional[str] = None

    # ML Predictions & Historical Data
    predictedValueNextYear: Optional[float] = None # Keep the single +1 year value
    predictionConfidence: Optional[float] = None
    predictedRentNextYear: Optional[float] = None
    marketTrend: Optional[str] = None
    trendConfidence: Optional[float] = None
    historicalValues: Optional[List[HistoricalValue]] = None
    # --- NEW: Prediction Points for Chart ---
    predictionPoints: Optional[List[PredictionPoint]] = None

    # Census Data
    censusData: Optional[CensusData] = None

    # AI Summary Field
    aiSummary: Optional[str] = None


# --- API Endpoint ---
@app.get(
    "/property",
    response_model=PropertyDataResponse,
    summary="Get Property Details and Predictions",
    description="Fetches property information from Rentcast, Census, adds ML predictions and AI-generated summaries."
)
async def get_property_details(
    address: str = Query(..., description="Full street address (e.g., '123 Main St, Anytown, CA')")
):
    logging.info(f"Backend received request for address: {address}")
    rentcast_data = None
    census_api_data = None
    parsed_census_data = None
    ml_predictions = None # Holds numerical predictions + points
    ai_summary = None # Holds the text summary

    try:
        # --- 1. Fetch base data from Rentcast ---
        rentcast_data_list = get_property_info(address=address)
        if not rentcast_data_list:
             raise HTTPException(status_code=404, detail="Property data not found for the specified address.")
        rentcast_data = rentcast_data_list[0]
        if 'zipCode' not in rentcast_data and rentcast_data.get('zipcode'):
             rentcast_data['zipCode'] = rentcast_data.get('zipcode')
        logging.info(f"Rentcast data received for {address}")


        # --- 2. Fetch and Parse Census Data ---
        zip_code = rentcast_data.get('zipCode')
        if zip_code and os.getenv("CENSUS_API_KEY"):
            try:
                census_api_data = await fetch_demographic_data(zipcode=zip_code)
                if census_api_data and isinstance(census_api_data, list) and len(census_api_data) > 1:
                    try:
                        header = census_api_data[0]
                        values = census_api_data[1]
                        raw_census_dict = {header[i]: values[i] for i in range(len(header))}
                        parsed_census_data = CensusData(
                            DP05_0001E=raw_census_dict.get('DP05_0001E'),
                            DP05_0002E=raw_census_dict.get('DP05_0002E'),
                            DP05_0003E=raw_census_dict.get('DP05_0003E'),
                            DP05_0018E=raw_census_dict.get('DP05_0018E')
                        )
                        logging.info(f"Parsed Census data")
                    except Exception as parse_err:
                        logging.error(f"Error parsing Census data: {parse_err}")
                        parsed_census_data = None
            except Exception as census_err:
                logging.error(f"Failed to fetch Census data: {census_err}")
                parsed_census_data = None
        else:
             logging.warning(f"Skipping Census fetch/parse (Zip: {zip_code}, Key Set: {bool(os.getenv('CENSUS_API_KEY'))})")


        # --- 3. Generate Numerical ML Predictions ---
        try:
            ml_predictions = generate_numerical_predictions(rentcast_data)
            logging.info(f"Numerical ML predictions generated successfully")
        except Exception as ml_err:
            logging.error(f"Error during numerical ML prediction: {ml_err}\n{traceback.format_exc()}")
            # Provide fallback structure even if ML fails
            ml_predictions = {
                "predictedValueNextYear": None, "predictionConfidence": 0.0,
                "marketTrend": "Error", "trendConfidence": 0.0,
                "predictedRentNextYear": None, "predictionPoints": []
            }


        # --- 4. Generate AI Summary using Gemini ---
        try:
            # Pass raw rentcast data, parsed census data (as dict), and numerical predictions
            census_dict_for_ai = parsed_census_data.model_dump(exclude_none=True, by_alias=False) if parsed_census_data else None
            ai_summary = await get_ai_summary(rentcast_data, census_dict_for_ai, ml_predictions)
            logging.info(f"AI summary processing completed.")
        except Exception as ai_err:
            logging.error(f"Error during AI summary generation: {ai_err}\n{traceback.format_exc()}")
            ai_summary = "AI summary could not be generated due to an unexpected error."


        # --- 5. Generate Historical Data (Placeholder) ---
        current_value = rentcast_data.get("valueEstimate")
        base_value_for_history = current_value if current_value else 550000
        historical_data = [
            {"date": "2022-01-01", "value": base_value_for_history * 0.9},
            {"date": "2022-07-01", "value": base_value_for_history * 0.95},
            {"date": "2023-01-01", "value": base_value_for_history * 1.0},
            {"date": "2023-07-01", "value": base_value_for_history * 1.02},
        ]
        logging.info(f"Generated historical data")


        # --- 6. Combine data into the response structure ---
        response_data = PropertyDataResponse(
            # Rentcast fields...
            id=rentcast_data.get('id'),
            address=address,
            formattedAddress=rentcast_data.get('formattedAddress'),
            latitude=rentcast_data.get('latitude'),
            longitude=rentcast_data.get('longitude'),
            bedrooms=rentcast_data.get('bedrooms'),
            bathrooms=rentcast_data.get('bathrooms'),
            squareFootage=rentcast_data.get('squareFootage'),
            lotSize=rentcast_data.get('lotSize'),
            yearBuilt=rentcast_data.get('yearBuilt'),
            propertyType=rentcast_data.get('propertyType'),
            description=rentcast_data.get('description'),
            valueEstimate=rentcast_data.get('valueEstimate'),
            valueEstimateLow=rentcast_data.get('valuationLow', rentcast_data.get('valueEstimateLow')),
            valueEstimateHigh=rentcast_data.get('valuationHigh', rentcast_data.get('valueEstimateHigh')),
            rentEstimate=rentcast_data.get('rentEstimate'),
            rentEstimateLow=rentcast_data.get('rentEstimateLow'),
            rentEstimateHigh=rentcast_data.get('rentEstimateHigh'),
            lastSoldDate=rentcast_data.get('lastSoldDate'),
            lastSoldPrice=rentcast_data.get('lastSoldPrice'),
            zipCode=rentcast_data.get('zipCode'),

            # Use ML results from the service
            predictedValueNextYear=ml_predictions.get('predictedValueNextYear'),
            predictionConfidence=ml_predictions.get('predictionConfidence'),
            marketTrend=ml_predictions.get('marketTrend'),
            trendConfidence=ml_predictions.get('trendConfidence'),
            predictedRentNextYear=ml_predictions.get('predictedRentNextYear'),
            predictionPoints=ml_predictions.get('predictionPoints'), # Add prediction points

            # AI Summary
            aiSummary=ai_summary,

            # Historical and Census data
            historicalValues=historical_data,
            censusData=parsed_census_data
        )

        logging.info(f"Backend successfully processed request for: {address}")
        return response_data

    # --- Error Handling ---
    except requests.exceptions.HTTPError as http_err:
        # ... (keep existing handling) ...
        status_code = http_err.response.status_code if http_err.response else 500
        if status_code == 401: raise HTTPException(status_code=503, detail="Service unavailable: Auth Error.")
        elif status_code == 404: raise HTTPException(status_code=404, detail="Property data not found.")
        else: raise HTTPException(status_code=502, detail="Bad Gateway: Error with data provider.")
    except HTTPException as fastapi_http_exc:
         raise fastapi_http_exc # Re-raise FastAPI's controlled exceptions
    except Exception as e:
        logging.error(f"Backend UNEXPECTED Error processing request for {address}:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


# --- Root endpoint ---
@app.get("/", summary="Health Check")
def read_root():
    return {"message": "ShelterSignal Backend is running"}
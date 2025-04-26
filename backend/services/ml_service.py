# backend/services/ml_service.py

import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Constants for Heuristic Model ---
DEFAULT_BASE_VALUE = 550000
AVG_SQFT_VALUE_NYC = 650
BEDROOM_VALUE_ADJ = 35000
BATHROOM_VALUE_ADJ = 20000
YEAR_BUILT_DEPRECIATION_RATE = 0.001
PROPERTY_TYPE_FACTORS = {
    "Single Family": 1.05, "Condo": 1.0, "Townhouse": 1.02,
    "Multi Family": 0.95, "Apartment": 1.0, "Default": 1.0
}
LOCATION_FACTORS = {
    "10005": 1.3, "10013": 1.4, "10019": 1.25, "10128": 1.2, # Manhattan
    "11201": 1.2, "11211": 1.15, "11215": 1.1, "11243": 1.1, # Brooklyn
    "11102": 1.0, "11375": 1.05, "11104": 0.98, # Queens
    "10463": 0.95, "10471": 1.0, # Bronx
    "10301": 0.9, "10309": 0.85, # Staten Island
    "Default": 1.0
}
ANNUAL_APPRECIATION_RATE = 0.04 # General market trend
PREDICTION_YEARS = 3 # How many years into the future to predict for the chart

def _calculate_heuristic_value(property_data: Dict[str, Any]) -> tuple[float, float]:
    """Calculates a heuristic base value and confidence based on features."""
    # --- This internal function remains the same as the previous version ---
    current_estimate = property_data.get('valueEstimate')
    sqft = property_data.get('squareFootage')
    bedrooms = property_data.get('bedrooms')
    bathrooms = property_data.get('bathrooms')
    year_built = property_data.get('yearBuilt')
    zip_code = property_data.get('zipCode')
    property_type = property_data.get('propertyType', "Default")

    base_value = current_estimate if current_estimate else DEFAULT_BASE_VALUE
    confidence = 0.75 if current_estimate else 0.50

    if sqft and sqft > 100:
        estimated_value_from_sqft = sqft * AVG_SQFT_VALUE_NYC
        if current_estimate:
            base_value = (base_value * 0.7) + (estimated_value_from_sqft * 0.3)
            confidence = min(0.9, confidence + 0.05)
        else:
            if 200000 < estimated_value_from_sqft < 10000000:
                 base_value = estimated_value_from_sqft
                 confidence = 0.60

    if bedrooms and bedrooms > 0:
        base_value += (bedrooms - 3) * BEDROOM_VALUE_ADJ
        confidence = min(0.9, confidence + 0.02)
    if bathrooms and bathrooms > 0:
        base_value += (bathrooms - 2) * BATHROOM_VALUE_ADJ
        confidence = min(0.9, confidence + 0.01)

    if year_built and 1800 < year_built <= datetime.now().year:
        age = datetime.now().year - year_built
        age_factor = max(0.85, 1 - (age * YEAR_BUILT_DEPRECIATION_RATE))
        base_value *= age_factor
        confidence = min(0.9, confidence + 0.02)

    prop_type_factor = PROPERTY_TYPE_FACTORS.get(property_type, PROPERTY_TYPE_FACTORS["Default"])
    base_value *= prop_type_factor

    location_factor = LOCATION_FACTORS.get(zip_code, LOCATION_FACTORS["Default"]) if zip_code else LOCATION_FACTORS["Default"]
    base_value *= location_factor
    if location_factor != LOCATION_FACTORS["Default"]:
        confidence = min(0.95, confidence + 0.05)

    base_value = max(50000, base_value)
    confidence = round(max(0.5, min(0.95, confidence)), 2) # Clamp and round confidence here

    return base_value, confidence


def generate_numerical_predictions(property_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates numerical predictions including future points for charting.
    """
    logging.info(f"Generating numerical predictions for property ID: {property_data.get('id', 'N/A')}")

    # 1. Calculate Heuristic Base Value and Confidence
    base_value, confidence = _calculate_heuristic_value(property_data)
    current_year = datetime.now().year

    # 2. Generate Prediction Points for Chart
    prediction_points = []
    current_pred_value = base_value # Start with the calculated base

    # Add current estimated value as the starting point (Year 0)
    # Use ISO format date for consistency with historical chart
    start_date = f"{current_year}-01-01" # Approximate start date
    prediction_points.append({"date": start_date, "value": round(current_pred_value, 0)})

    for i in range(1, PREDICTION_YEARS + 1):
        # Apply appreciation rate cumulatively
        current_pred_value *= (1 + ANNUAL_APPRECIATION_RATE)
        future_date = f"{current_year + i}-01-01"
        prediction_points.append({"date": future_date, "value": round(current_pred_value, 0)})

    # 3. Determine Market Trend
    market_trend = "Increasing" # Default
    trend_confidence = 0.70
    location_factor = LOCATION_FACTORS.get(property_data.get('zipCode'), LOCATION_FACTORS["Default"]) if property_data.get('zipCode') else LOCATION_FACTORS["Default"]
    if location_factor < 0.95:
        market_trend = "Stable"
        trend_confidence = 0.60
    elif location_factor > 1.2:
        trend_confidence = 0.80

    # 4. Prepare final prediction dictionary
    predictions = {
        # Use the +1 year value for the main prediction display
        "predictedValueNextYear": prediction_points[1]['value'] if len(prediction_points) > 1 else None,
        "predictionConfidence": confidence,
        "marketTrend": market_trend,
        "trendConfidence": round(trend_confidence, 2),
        "predictedRentNextYear": None, # Rent prediction still needs separate logic
        "predictionPoints": prediction_points # Include the points for the chart
    }

    logging.info(f"Numerical prediction results: {predictions}")
    return predictions
# backend/services/gemini_service.py

import os
import logging
import google.generativeai as genai
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configure Gemini API ---
# Load the API key from environment variables (set via .env and load_dotenv in main.py)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure the genai library
if not GEMINI_API_KEY:
    logging.error("CRITICAL: GEMINI_API_KEY environment variable not found! AI Summary will fail.")
    # You might want to raise an error or handle this case explicitly depending on requirements
    # For the hackathon, we'll let it proceed but log the error.
    # genai.configure(api_key="DUMMY_KEY_DO_NOT_USE") # Avoids crash but calls will fail
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logging.info("Gemini API configured successfully using environment variable.")
    except Exception as e:
        logging.error(f"Failed to configure Gemini API with provided key: {e}")
        # Handle configuration error if needed (e.g., raise exception)
        GEMINI_API_KEY = None # Ensure we don't try to use a bad config

# Select the model (gemini-1.5-flash is fast and suitable for summaries)
MODEL_NAME = "gemini-1.5-flash"

def generate_property_summary_prompt(property_data: Dict[str, Any], census_data: Optional[Dict[str, Any]], ml_predictions: Dict[str, Any]) -> str:
    """Creates a detailed prompt for the Gemini API."""

    # --- Extract and format data for the prompt ---
    address = property_data.get('formattedAddress', 'the property')
    prop_type = property_data.get('propertyType', 'N/A')
    bedrooms = property_data.get('bedrooms', 'N/A')
    bathrooms = property_data.get('bathrooms', 'N/A')
    sqft = f"{property_data.get('squareFootage'):,}" if property_data.get('squareFootage') else 'N/A'
    year_built = property_data.get('yearBuilt', 'N/A')
    zip_code = property_data.get('zipCode', 'N/A')

    value_est = f"${property_data.get('valueEstimate'):,.0f}" if property_data.get('valueEstimate') else 'N/A'
    rent_est = f"${property_data.get('rentEstimate'):,.0f}/mo" if property_data.get('rentEstimate') else 'N/A'

    pred_value = f"${ml_predictions.get('predictedValueNextYear'):,.0f}" if ml_predictions.get('predictedValueNextYear') else 'N/A'
    pred_trend = ml_predictions.get('marketTrend', 'Unknown')
    pred_conf = f"{ml_predictions.get('predictionConfidence', 0)*100:.0f}%"

    census_pop = f"{census_data.get('totalPopulation'):,}" if census_data and census_data.get('totalPopulation') else 'N/A'
    census_age = f"{census_data.get('medianAge'):.1f}" if census_data and census_data.get('medianAge') else 'N/A'

    # --- Construct the Prompt ---
    prompt = f"""
    Analyze the following real estate property data and generate a concise investment summary in Markdown format. Be informative but cautious, acting like a helpful real estate analysis assistant.

    **Property Details:**
    *   Address: {address}
    *   Type: {prop_type}
    *   Bedrooms: {bedrooms}
    *   Bathrooms: {bathrooms}
    *   Square Footage: {sqft} sqft
    *   Year Built: {year_built}

    **Current Market Data (Estimates):**
    *   Estimated Value: {value_est}
    *   Estimated Rent: {rent_est}

    **Forecast & Prediction (1-Year Outlook):**
    *   Predicted Value: {pred_value}
    *   Market Trend: {pred_trend}
    *   Prediction Confidence: {pred_conf}

    **Location Context (Zip Code: {zip_code}):**
    *   Total Population (Zip): {census_pop}
    *   Median Age (Zip): {census_age}

    **Instructions:**
    1.  Provide a brief **Property Overview**.
    2.  Summarize the **Current Market Snapshot** based on estimates.
    3.  Explain the **Future Outlook** based on the prediction.
    4.  Briefly mention the **Location Context** using demographic data.
    5.  Keep the tone professional and objective. Use Markdown for structure (bolding, bullet points).
    6.  Include a short disclaimer at the end stating this is AI-generated analysis and not financial advice.
    7.  Do not invent data not provided above. If data is 'N/A', acknowledge the limitation.
    """
    return prompt.strip()


async def get_ai_summary(property_data: Dict[str, Any], census_data: Optional[Dict[str, Any]], ml_predictions: Dict[str, Any]) -> Optional[str]:
    """
    Calls the Gemini API to generate a property summary.
    Returns the summary as a Markdown string or None if an error occurs or the key is missing/invalid.
    """
    if not GEMINI_API_KEY:
        logging.warning("Gemini API key is missing or invalid in environment. Skipping AI summary generation.")
        return "**AI Summary Generation Disabled:** API Key not configured."

    prompt = generate_property_summary_prompt(property_data, census_data, ml_predictions)
    logging.info(f"Generated Gemini prompt for {property_data.get('formattedAddress', 'property')}")

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        # Optional: Configure generation parameters (e.g., temperature) or safety settings
        # generation_config = genai.types.GenerationConfig(temperature=0.7)
        # safety_settings = [...] # Define safety settings if needed

        response = await model.generate_content_async(
            prompt,
            # generation_config=generation_config,
            # safety_settings=safety_settings
            )

        # Check for blocked content or empty response
        if response.parts:
            summary_text = response.text
            logging.info(f"Successfully received AI summary from Gemini for {property_data.get('formattedAddress', 'property')}")
            return summary_text.strip()
        else:
            # Log the reason if available
            block_reason = "Unknown"
            safety_ratings = "N/A"
            try: # Accessing feedback might raise errors if response structure is unexpected
                if response.prompt_feedback:
                    block_reason = response.prompt_feedback.block_reason or "Not Blocked"
                    safety_ratings = response.prompt_feedback.safety_ratings or "N/A"
            except Exception as feedback_err:
                 logging.warning(f"Could not access detailed prompt feedback: {feedback_err}")

            logging.warning(f"Gemini response for {property_data.get('formattedAddress', 'property')} was empty or potentially blocked. Reason: {block_reason}, Safety Ratings: {safety_ratings}")
            return f"**AI Summary Generation Issue:** Content generation issue (Reason: {block_reason}). Please review input data or try again later."

    except Exception as e:
        # Catch potential API errors (network, authentication, quota, etc.)
        logging.error(f"Error calling Gemini API: {e}", exc_info=True) # Log stack trace
        # Provide a generic error message to the user
        return "**AI Summary Generation Failed:** An error occurred while contacting the AI service."
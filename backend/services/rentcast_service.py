# backend/services/rentcast_service.py

import os
import requests
import logging # Use logging instead of print for better practice

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

RENTCAST_API_KEY = os.getenv("RENTCAST_API_KEY")
RENTCAST_BASE_URL = "https://api.rentcast.io/v1"

# Add a check and log if the API key is missing right at the start
if not RENTCAST_API_KEY:
    logging.error("CRITICAL: RENTCAST_API_KEY environment variable not found!")
else:
    # Log partial key for confirmation without exposing the whole thing
    logging.info(f"Rentcast Service: Using API Key ending in ...{RENTCAST_API_KEY[-4:]}")


def get_property_info(address=None, city=None, state=None, zip_code=None):
    url = f"{RENTCAST_BASE_URL}/properties"
    headers = {
        "X-Api-Key": RENTCAST_API_KEY,
        "Accept": "application/json"
    }
    # Ensure API key is actually present before making the call
    if not RENTCAST_API_KEY:
         logging.error("Rentcast call aborted: API Key is missing.")
         # Raise an internal exception or return None/empty list,
         # which main.py should handle appropriately.
         # Raising HTTPError here might be misleading.
         raise ValueError("Rentcast API Key is not configured.")

    params = {}
    if address:
        params["address"] = address
    if city:
        params["city"] = city
    if state:
        params["state"] = state
    if zip_code:
        params["zipCode"] = zip_code

    logging.info(f"Calling Rentcast API: URL={url}, Params={params}") # Log request details

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10) # Add a timeout

        # --- DETAILED LOGGING BEFORE raise_for_status ---
        logging.info(f"Rentcast Response Status Code: {response.status_code}")
        # Log first 500 chars of response text for debugging, regardless of status code
        logging.info(f"Rentcast Response Text (first 500 chars): {response.text[:500]}")
        # --- END OF DETAILED LOGGING ---

        # Now, check the status code explicitly before raising
        response.raise_for_status() # Raise HTTPError for 4xx/5xx status codes

        # If raise_for_status didn't trigger, we have a successful response (2xx)
        logging.info(f"Rentcast call successful for address: {address}")
        return response.json()

    except requests.exceptions.RequestException as e:
        # Catch potential connection errors, timeouts, etc.
        logging.error(f"Rentcast API request failed: {e}")
        # Re-raise or handle as appropriate for main.py
        # Raising the original exception might be best here
        raise e
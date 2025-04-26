# backend/services/zillow_service.py
import os
import requests

ZILLOW_API_KEY = os.getenv("ZILLOW_API_KEY")

def get_property_info(address: str):
    """Get basic property info from Zillow API."""
    url = "https://zillow-com1.p.rapidapi.com/resolveAddressToZpid"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
        "x-rapidapi-key": ZILLOW_API_KEY,
    }
    payload = {"address": address}

    response = requests.post(url, data=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    return {
        "zpid": data.get("zpid"),
        "price": data.get("price"),
        "address": data.get("address"),
    }

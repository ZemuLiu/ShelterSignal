import os
import httpx

FRED_API_KEY = os.getenv("FRED_API_KEY")

async def fetch_market_trends():
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": "CSUSHPINSA",  # Example: U.S. Home Price Index
        "api_key": FRED_API_KEY,
        "file_type": "json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        fred_data = response.json()

    return fred_data

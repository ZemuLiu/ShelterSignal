import os
import httpx

CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")

async def fetch_demographic_data(zipcode: str):
    url = f"https://api.census.gov/data/2020/acs/acs5/profile"
    params = {
        "get": "DP05_0001E,DP05_0002E,DP05_0003E,DP05_0004E",  # Total, Male, Female, Median Age
        "for": f"zip code tabulation area:{zipcode}",
        "key": CENSUS_API_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        census_data = response.json()

    return census_data

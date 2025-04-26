import os
import httpx

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

async def fetch_market_news():
    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "q": "real estate OR housing market",
        "language": "en",
        "apiKey": NEWSAPI_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        news_data = response.json()

    return news_data

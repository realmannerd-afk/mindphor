BASE_URL = "https://mindphor.vercel.app"

class MindphorClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = BASE_URL

    def post(self, endpoint: str,
             data: dict) -> dict:
        import requests
        try:
            res = requests.post(
                f"{self.base_url}{endpoint}",
                json=data,
                timeout=5
            )
            return res.json()
        except Exception as e:
            # Never crash developer's app
            print(f"[Mindphor] Error: {e}")
            return {}

    def get(self, endpoint: str,
            params: dict) -> dict:
        import requests
        try:
            res = requests.get(
                f"{self.base_url}{endpoint}",
                params=params,
                timeout=5
            )
            return res.json()
        except Exception as e:
            print(f"[Mindphor] Error: {e}")
            return {}

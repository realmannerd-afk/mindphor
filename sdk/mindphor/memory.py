import requests
from .client import MindphorClient

class Memory:
    def __init__(self, api_key: str):
        self.client = MindphorClient(api_key)
        self.api_key = api_key

    def set(self, user_id: str,
            key: str, value: str) -> bool:
        res = self.client.post(
            "/api/memory", {
                "api_key": self.api_key,
                "user_id": user_id,
                "key": key,
                "value": str(value)
            }
        )
        return res.get("success", False)

    def get(self, user_id: str) -> list:
        res = self.client.get(
            "/api/memory", {
                "api_key": self.api_key,
                "user_id": user_id
            }
        )
        return res.get("keys", [])

    def delete(self, user_id: str,
               key: str = None) -> bool:
        try:
            res = requests.delete(
                f"{self.client.base_url}"
                f"/api/memory",
                json={
                    "api_key": self.api_key,
                    "user_id": user_id,
                    "key": key
                },
                timeout=5
            )
            return res.json().get(
                "success", False
            )
        except Exception as e:
            print(f"[Mindphor] Error: {e}")
            return False
from abc import ABC, abstractmethod
from typing import List, Optional
import json
import httpx
from ..core.config import settings


class AresService(ABC):
    @abstractmethod
    async def ask(self, prompt: str, history: Optional[List[dict]] = None) -> str:
        pass

    @abstractmethod
    async def get_session_history(self, session_key: str, limit: int = 50) -> list:
        pass


class HttpAresService(AresService):
    def __init__(self):
        self._url = settings.ARES_API_URL
        self._model = settings.ARES_MODEL
        self._api_key = settings.ARES_API_KEY
        self._client = httpx.AsyncClient(timeout=60.0)
        self._session_id = settings.ARES_SESSION_ID

    async def ask(self, prompt: str, history=None) -> str:
        payload = {
            "model": self._model,
            "input": prompt,
            "user": self._session_id,
        }

        headers = {
            "Content-Type": "application/json",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        try:
            response = await self._client.post(
                f"{self._url}/v1/responses",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()

            for item in data.get("output", []):
                if item.get("type") == "message":
                    for part in item.get("content", []):
                        if part.get("type") == "output_text":
                            return part.get("text", "").strip()
            return ""
        except Exception as e:
            print(f"[ARES Service] ERROR: {type(e).__name__}: {e}")
            return f"Lo siento pedazo de inutil, no puedo responder en este momento. ({str(e)})"

    async def get_session_history(self, session_key: str, limit: int = 50) -> list:
        payload = {
            "tool": "sessions_history",
            "args": {
                "sessionKey": f"openresponses-user:{session_key}",
                "limit": limit
            }
        }

        response = await self._client.post(
            f"{self._url}/tools/invoke",
            json=payload,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            }
        )
        response.raise_for_status()
        data = response.json()

        content_list = data.get("result", {}).get("content", [])
        if not content_list or content_list[0].get("type") != "text":
            return []

        inner = json.loads(content_list[0].get("text", "{}"))
        messages = inner.get("messages", [])

        result = []
        for msg in messages:
            text = " ".join(
                p.get("text", "") for p in msg.get("content", [])
                if p.get("type") == "text"
            )
            if text:
                result.append({"role": msg.get("role", "user"), "content": text})

        return result

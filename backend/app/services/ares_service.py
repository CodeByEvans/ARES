from abc import ABC, abstractmethod
from typing import List, Optional
import httpx
from ..core.config import settings


class AresService(ABC):
    @abstractmethod
    async def ask(self, prompt: str, history: Optional[List[dict]] = None) -> str:
        pass


class HttpAresService(AresService):
    def __init__(self):
        self._url = settings.ARES_API_URL
        self._model = settings.ARES_MODEL
        self._api_key = settings.ARES_API_KEY
        self._client = httpx.AsyncClient(timeout=60.0)
        self._session_id =  settings.ARES_SESSION_ID
        self._previous_response_id: Optional[str] = None

    async def ask(self, prompt: str, history=None) -> str:
        payload = {
            "model": self._model,
            "input": prompt,
        }

        if self._previous_response_id:
            payload["previous_response_id"] = self._previous_response_id

        headers = {
            "Content-Type": "application/json",
            "x-openclaw-session-key": self._session_id,
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
            self._previous_response_id = data.get("id")

            for item in data.get("output", []):
                if item.get("type") == "message":
                    for part in item.get("content", []):
                        if part.get("type") == "output_text":
                            return part.get("text", "").strip()
            return ""
        except Exception as e:
            print(f"[ARES Service] ERROR: {type(e).__name__}: {e}")
            return f"Lo siento pedazo de inutil, no puedo responder en este momento. ({str(e)})"
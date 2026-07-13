from pydantic import BaseModel, Field
from typing import Optional, List


class AskRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    history: Optional[List[dict]] = []


class AskResponse(BaseModel):
    response: str
    model: str


class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    voice: Optional[str] = None
    lang: Optional[str] = None


class TtsResponse(BaseModel):
    audio_url: str
    format: str = "wav"


class ErrorResponse(BaseModel):
    detail: str

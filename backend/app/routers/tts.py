from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
import os
from ..schemas.requests import TtsRequest, ErrorResponse
from ..services.tts_service import TtsService

router = APIRouter()


def get_tts_service() -> TtsService:
    pass


@router.post(
    "/tts",
    responses={400: {"model": ErrorResponse}},
)
async def synthesize_speech(
    payload: TtsRequest,
    tts_service: TtsService = Depends(get_tts_service),
):
    audio_path = await tts_service.synthesize(
        text=payload.text, voice=payload.voice
    )
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename="speech.mp3",
    )

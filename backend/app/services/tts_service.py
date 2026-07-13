# services/tts_service.py
from abc import ABC, abstractmethod
import tempfile
import os
import re
import edge_tts
from ..core.config import settings


class TtsService(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice: str | None = None, rate: str = "+0%") -> str:
        pass


import re

import re


def clean_text_for_tts(text: str) -> str:
    """Limpia y prepara el texto para una síntesis de voz natural."""

    # Elimina comillas tipográficas y normales
    text = re.sub(r'[“”"\'‘’«»]', '', text)

    # Elimina markdown
    text = re.sub(r'[*_`#]', '', text)

    # Elimina viñetas
    text = re.sub(r'^\s*[-•]\s*', '', text, flags=re.MULTILINE)

    # Elimina numeraciones tipo "1. "
    text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)

    # Sustituye saltos de línea por una pausa natural
    text = re.sub(r'\n+', '. ', text)

    # Convierte "..." repetidos en exactamente tres puntos
    text = re.sub(r'\.{4,}', '...', text)

    # Elimina espacios múltiples
    text = re.sub(r'\s+', ' ', text)

    # Elimina emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F300-\U0001FAFF"
        "\U00002600-\U000027BF"
        "\U0001F1E6-\U0001F1FF"
        "]+",
        flags=re.UNICODE,
    )
    text = emoji_pattern.sub("", text)

    # Corrige espacios antes de signos de puntuación
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)

    return text.strip()


class EdgeTTSService(TtsService):
    def __init__(self):
        self._default_voice = settings.TTS_VOICE  # ej. "es-MX-DaliaNeural"

    async def synthesize(self, text: str, voice: str | None = None, rate: str = "+0%") -> str:
        clean_text = clean_text_for_tts(text)
        selected_voice = voice or self._default_voice

        fd, output_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)

        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=self._default_voice,
            rate=settings.TTS_RATE,
            pitch=settings.TTS_PITCH,
            volume=settings.TTS_VOLUME,
        )
        await communicate.save(output_path)

        return output_path
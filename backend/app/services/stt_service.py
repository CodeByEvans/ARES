from abc import ABC, abstractmethod


class SttService(ABC):
    @abstractmethod
    async def transcribe(self, audio_path: str) -> str:
        pass

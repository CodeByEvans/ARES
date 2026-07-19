from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ARES_SESSION_ID: str = "ARES-APP"
    ARES_API_URL: str = "http://localhost:18789"
    ARES_MODEL: str = "openclaw/main"
    ARES_API_KEY: str = ""
    TTS_VOICE: str = "es-ES-AlvaroNeural"
    TTS_LANG: str = "es"
    TTS_RATE: str = "-5%"
    TTS_PITCH: str = "-1Hz"
    TTS_VOLUME: str = "+0%"
    B2_APPLICATION_KEY_ID: str = ""
    B2_APPLICATION_KEY: str = ""
    B2_REALM: str = "production"
    B2_BUCKET_NAME: str = "ares-storage"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
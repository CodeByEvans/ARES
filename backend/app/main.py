from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import talk, chat, tts, sessions
from .services.ares_service import HttpAresService
from .services.tts_service import EdgeTTSService

app = FastAPI(
    title="ARES",
    description="Backend API for ARES",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ares_service = HttpAresService()
tts_service = EdgeTTSService()


def get_ares_service():
    return ares_service


def get_tts_service():
    return tts_service


app.dependency_overrides = {
    talk.get_ares_service: get_ares_service,
    chat.get_ares_service: get_ares_service,
    tts.get_tts_service: get_tts_service,
    sessions.get_ares_service: get_ares_service,
}
app.include_router(talk.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ARES Voice API"}

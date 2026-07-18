from fastapi import APIRouter, Depends
from ..services.ares_service import AresService
from ..core.config import settings

router = APIRouter()


def get_ares_service() -> AresService:
    pass


@router.get("/sessions/history")
async def get_session_history(
    ares_service: AresService = Depends(get_ares_service),
):
    history = await ares_service.get_session_history(
        session_key=settings.ARES_SESSION_ID
    )
    return {"history": history}

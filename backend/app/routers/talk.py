from fastapi import APIRouter, Depends
from ..schemas.requests import AskRequest, AskResponse, ErrorResponse
from ..services.ares_service import AresService
from ..core.config import settings

router = APIRouter()


def get_ares_service() -> AresService:
    pass


@router.post(
    "/talk",
    response_model=AskResponse,
    responses={400: {"model": ErrorResponse}},
)
async def talk_ares(
    payload: AskRequest,
    ares_service: AresService = Depends(get_ares_service),
):
    response = await ares_service.ask(prompt=payload.prompt, history=payload.history)
    return AskResponse(response=response, model=settings.ARES_MODEL)

from fastapi import APIRouter, Depends, Query
from ..services.b2_service import B2Service

router = APIRouter()


def get_b2_service() -> B2Service:
    pass


@router.get("/buckets")
async def get_buckets(b2: B2Service = Depends(get_b2_service)):
    projects = b2.list_project_folders()
    prompts_files = b2.list_folder("prompts")
    archives_data = b2.list_root()
    prompts_stats = b2.get_folder_stats("prompts")

    return {
        "projects": projects,
        "prompts": {
            "files": prompts_files,
            "file_count": prompts_stats["file_count"],
            "total_size": prompts_stats["total_size"],
        },
        "archives": {
            "files": archives_data.get("files", []),
            "folders": archives_data.get("folders", []),
            "file_count": len(archives_data.get("files", [])),
        },
    }


@router.get("/buckets/files")
async def get_bucket_files(
    prefix: str = Query(default=""),
    b2: B2Service = Depends(get_b2_service),
):
    if prefix:
        files = b2.list_folder(prefix)
        stats = b2.get_folder_stats(prefix)
    else:
        data = b2.list_root()
        files = data.get("files", [])
        stats = {"file_count": len(files), "total_size": sum(f.get("size", 0) for f in files)}

    return {
        "files": files,
        "file_count": stats["file_count"],
        "total_size": stats["total_size"],
    }

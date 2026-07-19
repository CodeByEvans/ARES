import logging
from datetime import datetime, timezone
from b2sdk.v3 import InMemoryAccountInfo, B2Api, AuthInfoCache
from b2sdk.v3.exception import B2Error
from ..core.config import settings

logger = logging.getLogger("b2_service")

PROJECTS_PREFIX = "projects/"


class B2ServiceError(Exception):
    """Wraps any failure talking to B2 so routers can turn it into an HTTPException."""


class B2Service:
    def __init__(self):
        self._b2_api: B2Api | None = None
        self._bucket = None

    @property
    def b2_api(self) -> B2Api:
        if self._b2_api is None:
            info = InMemoryAccountInfo()
            self._b2_api = B2Api(info, cache=AuthInfoCache(info))
            self._b2_api.authorize_account(
                application_key_id=settings.B2_APPLICATION_KEY_ID,
                application_key=settings.B2_APPLICATION_KEY,
                realm=settings.B2_REALM,
            )
        return self._b2_api

    @property
    def bucket(self):
        if self._bucket is None:
            self._bucket = self.b2_api.get_bucket_by_name(settings.B2_BUCKET_NAME)
        return self._bucket

    @staticmethod
    def _to_dict(file_version, prefix: str = "") -> dict:
        name = file_version.file_name
        if prefix and name.startswith(prefix):
            name = name[len(prefix):]
        return {
            "id": file_version.id_,
            "name": name,
            "size": file_version.size or 0,
            "content_type": file_version.content_type or "unknown",
            "uploaded": datetime.fromtimestamp(
                file_version.upload_timestamp / 1000, tz=timezone.utc
            ).isoformat(),
            "action": file_version.action,
        }

    def list_folder(self, folder: str = "") -> list[dict]:
        prefix = f"{folder}/" if folder else ""
        try:
            return [
                self._to_dict(fv, prefix)
                for fv, _ in self.bucket.ls(path=prefix, latest_only=True)
                if not fv.file_name.endswith("/.bzEmpty")
            ]
        except (B2Error, Exception) as e:
            logger.exception("list_folder(%s) failed", folder)
            raise B2ServiceError(str(e)) from e

    def list_root(self) -> dict:
        try:
            folders: set[str] = set()
            files: list[dict] = []
            for fv, folder_name in self.bucket.ls(latest_only=True):
                if folder_name:
                    folders.add(folder_name.rstrip("/"))
                if fv.file_name.endswith("/.bzEmpty"):
                    continue
                files.append(self._to_dict(fv))
            return {"files": files, "folders": sorted(folders)}
        except (B2Error, Exception) as e:
            logger.exception("list_root() failed")
            raise B2ServiceError(str(e)) from e

    def get_folder_stats(self, folder: str) -> dict:
        try:
            total_size = 0
            count = 0
            for fv, _ in self.bucket.ls(path=f"{folder}/", latest_only=True, recursive=True):
                if not fv.file_name.endswith("/.bzEmpty"):
                    total_size += fv.size or 0
                    count += 1
            return {"total_size": total_size, "file_count": count}
        except (B2Error, Exception):
            logger.exception("get_folder_stats(%s) failed", folder)
            return {"total_size": 0, "file_count": 0}

    def list_project_folders(self) -> list[dict]:
        try:
            project_names: list[str] = []
            for fv, _ in self.bucket.ls(path=PROJECTS_PREFIX, latest_only=True):
                relative = fv.file_name[len(PROJECTS_PREFIX):]
                if "/" in relative:
                    name = relative.split("/", 1)[0]
                    if name and name not in project_names:
                        project_names.append(name)

            return [
                {"name": name, **self.get_folder_stats(f"{PROJECTS_PREFIX}{name}")}
                for name in project_names
            ]
        except (B2Error, Exception) as e:
            logger.exception("list_project_folders() failed")
            raise B2ServiceError(str(e)) from e
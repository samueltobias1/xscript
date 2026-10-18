"""Configuración: todo sale de variables de entorno (archivo .env en el servidor; nunca en el repo)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache


def _list(v: str) -> list[str]:
    return [x.strip().lower() for x in v.replace(";", ",").split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    env: str = "prod"
    public_host: str = "localhost"
    data_dir: str = "/data"
    owner_emails: list[str] = field(default_factory=list)
    google_client_id: str = ""
    google_client_secret: str = ""
    s3_bucket: str = ""
    s3_host: str = ""
    s3_region: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    dev_login: bool = False

    @property
    def google_redirect_uri(self) -> str:
        scheme = "http" if self.public_host.startswith(("localhost", "127.")) else "https"
        return f"{scheme}://{self.public_host}/api/auth/callback"

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def s3_configured(self) -> bool:
        return bool(self.s3_bucket and self.s3_host and self.s3_access_key and self.s3_secret_key)

    @property
    def secure_cookies(self) -> bool:
        return not self.public_host.startswith(("localhost", "127."))


@lru_cache
def get_settings() -> Settings:
    e = os.environ.get
    return Settings(
        env=e("XS_ENV", "prod"),
        public_host=e("XS_PUBLIC_HOST", "localhost"),
        data_dir=e("XS_DATA_DIR", "/data"),
        owner_emails=_list(e("XS_OWNER_EMAILS", "")),
        google_client_id=e("XS_GOOGLE_CLIENT_ID", ""),
        google_client_secret=e("XS_GOOGLE_CLIENT_SECRET", ""),
        s3_bucket=e("XS_S3_BUCKET", ""),
        s3_host=e("XS_S3_HOST", ""),
        s3_region=e("XS_S3_REGION", ""),
        s3_access_key=e("XS_S3_ACCESS_KEY", ""),
        s3_secret_key=e("XS_S3_SECRET_KEY", ""),
        dev_login=e("XS_DEV_LOGIN", "") == "1" and e("XS_ENV", "prod") != "prod",
    )

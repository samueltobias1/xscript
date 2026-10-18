"""Login con Google (OpenID Connect): solo nombre y correo. Misma receta que Shoter."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from urllib.parse import urlencode

import httpx
import jwt

from app.config import get_settings

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"  # noqa: S105 - es una URL
JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
ISSUERS = ("https://accounts.google.com", "accounts.google.com")


class GoogleError(Exception):
    pass


@dataclass(frozen=True)
class Identity:
    email: str
    email_verified: bool
    name: str
    picture: str | None
    nonce: str | None


class GoogleOIDC:
    def __init__(self) -> None:
        self.s = get_settings()
        self._jwks = jwt.PyJWKClient(JWKS_URL, cache_keys=True, lifespan=3600)

    def authorize_url(self, state: str, nonce: str) -> str:
        q = {
            "client_id": self.s.google_client_id,
            "redirect_uri": self.s.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "nonce": nonce,
            "prompt": "select_account",
        }
        return f"{AUTH_URL}?{urlencode(q)}"

    def exchange(self, code: str) -> Identity:
        try:
            r = httpx.post(
                TOKEN_URL,
                data={
                    "code": code,
                    "client_id": self.s.google_client_id,
                    "client_secret": self.s.google_client_secret,
                    "redirect_uri": self.s.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
                timeout=10,
            )
        except httpx.HTTPError as e:
            raise GoogleError("No se pudo contactar a Google") from e
        if r.status_code != 200:
            raise GoogleError(f"Google rechazó el código ({r.status_code})")
        tok = r.json().get("id_token")
        if not tok:
            raise GoogleError("Google no devolvió id_token")
        try:
            key = self._jwks.get_signing_key_from_jwt(tok)
            c = jwt.decode(
                tok,
                key.key,
                algorithms=["RS256"],
                audience=self.s.google_client_id,
                issuer=list(ISSUERS),
                leeway=60,
                options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            )
        except jwt.PyJWTError as e:
            raise GoogleError("Token de Google inválido") from e
        return Identity(
            email=str(c.get("email", "")).strip().lower(),
            email_verified=c.get("email_verified") is True,
            name=str(c.get("name", ""))[:200],
            picture=(str(c["picture"])[:1000] if c.get("picture") else None),
            nonce=c.get("nonce"),
        )


@lru_cache
def get_google() -> GoogleOIDC:
    return GoogleOIDC()

"""Archivos grandes (PDFs y copias del historial).

Con llaves de Hetzner Object Storage (S3) van al bucket; sin llaves, a /data/blobs en el disco.
Firma AWS SigV4 por query string, sin librerías extra (misma receta que Shoter).
"""

from __future__ import annotations

import hashlib
import hmac
import os
import urllib.error
import urllib.request
from datetime import UTC, datetime
from urllib.parse import quote

from app.config import get_settings

UNRESERVED = "-_.~"


class StorageError(RuntimeError):
    pass


def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def presign(method: str, key: str, expires: int = 300) -> str:
    s = get_settings()
    t = datetime.now(UTC)
    amz_date, day = t.strftime("%Y%m%dT%H%M%SZ"), t.strftime("%Y%m%d")
    host = f"{s.s3_bucket}.{s.s3_host}"
    region = s.s3_region or s.s3_host.split(".")[0]
    scope = f"{day}/{region}/s3/aws4_request"
    params = {
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": f"{s.s3_access_key}/{scope}",
        "X-Amz-Date": amz_date,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": "host",
    }
    query = "&".join(f"{quote(k, safe=UNRESERVED)}={quote(v, safe=UNRESERVED)}" for k, v in sorted(params.items()))
    path = "/" + quote(key, safe=UNRESERVED + "/")
    canonical = f"{method}\n{path}\n{query}\nhost:{host}\n\nhost\nUNSIGNED-PAYLOAD"
    to_sign = f"AWS4-HMAC-SHA256\n{amz_date}\n{scope}\n{hashlib.sha256(canonical.encode()).hexdigest()}"
    k = _sign(_sign(_sign(_sign(f"AWS4{s.s3_secret_key}".encode(), day), region), "s3"), "aws4_request")
    sig = hmac.new(k, to_sign.encode(), hashlib.sha256).hexdigest()
    return f"https://{host}{path}?{query}&X-Amz-Signature={sig}"


def _local(key: str) -> str:
    base = os.path.join(get_settings().data_dir, "blobs")
    p = os.path.normpath(os.path.join(base, key))
    if not p.startswith(base + os.sep):
        raise StorageError("ruta inválida")
    return p


def put(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    if get_settings().s3_configured:
        req = urllib.request.Request(presign("PUT", key), data=data, method="PUT", headers={"Content-Type": content_type})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310 - URL propia firmada
                if r.status >= 300:
                    raise StorageError(f"La nube respondió {r.status}")
        except urllib.error.URLError as e:
            raise StorageError(f"No se pudo subir a la nube: {e}") from e
        return
    p = _local(key)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, p)


def get(key: str) -> bytes:
    if get_settings().s3_configured:
        try:
            with urllib.request.urlopen(presign("GET", key), timeout=60) as r:  # noqa: S310
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise FileNotFoundError(key) from e
            raise StorageError(f"No se pudo leer de la nube: {e}") from e
        except urllib.error.URLError as e:
            raise StorageError(f"No se pudo leer de la nube: {e}") from e
    with open(_local(key), "rb") as f:
        return f.read()


def delete(key: str) -> None:
    if get_settings().s3_configured:
        req = urllib.request.Request(presign("DELETE", key), method="DELETE")
        try:
            urllib.request.urlopen(req, timeout=30).close()  # noqa: S310
        except urllib.error.URLError:
            pass
        return
    try:
        os.remove(_local(key))
    except FileNotFoundError:
        pass

"""XSCRIPT en la nube: login con Google, proyectos, permisos, turno de edición, historial y PDFs.

Un proyecto se guarda completo (el mismo JSON que la app ya sabía armar, sin los PDFs) comprimido
con gzip. Los PDFs viven aparte. Cada 10 minutos de cambios queda una copia en el historial.
"""

from __future__ import annotations

import gzip
import hashlib
import html
import json
import re
import secrets
import uuid

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from app import storage
from app.config import get_settings
from app.db import conn, now
from app.google import GoogleError, get_google

app = FastAPI(title="XSCRIPT", docs_url=None, redoc_url=None, openapi_url=None)

COOKIE = "xs_session"
SESSION_DAYS = 90
LOCK_SECS = 90
SNAP_EVERY = 600
SNAP_KEEP = 300
MAX_PROJECT = 80 * 1024 * 1024
MAX_PDF = 60 * 1024 * 1024
ROLES = ("edit", "view")
ID_RE = re.compile(r"^[A-Za-z0-9_-]{6,64}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def thash(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()


def page(title: str, msg: str, code: int = 200) -> HTMLResponse:
    body = (
        "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
        f"<title>{html.escape(title)}</title><body style='font:16px system-ui;background:#16171b;color:#e8e8ea;"
        "display:grid;place-items:center;min-height:90vh;margin:0'><div style='max-width:460px;padding:24px'>"
        f"<h1 style='font-size:22px'>{html.escape(title)}</h1><p style='color:#a5a7ad;line-height:1.5'>{msg}</p>"
        "<p><a style='color:#8fa2ff' href='/'>Volver a XSCRIPT</a></p></div>"
    )
    return HTMLResponse(body, code)


# ---------------------------------------------------------------- sesión
def allowed(email: str) -> bool:
    s = get_settings()
    if email in s.owner_emails:
        return True
    return conn().execute("SELECT 1 FROM shares WHERE email=? LIMIT 1", (email,)).fetchone() is not None


def new_session(resp: Response, email: str, name: str = "", picture: str | None = None) -> None:
    c, t = conn(), now()
    c.execute(
        "INSERT INTO users(email,name,picture,created,last_login) VALUES(?,?,?,?,?) "
        "ON CONFLICT(email) DO UPDATE SET name=excluded.name,picture=excluded.picture,last_login=excluded.last_login",
        (email, name, picture, t, t),
    )
    tok = secrets.token_urlsafe(32)
    c.execute("INSERT INTO sessions VALUES(?,?,?,?)", (thash(tok), email, t, t + SESSION_DAYS * 86400))
    resp.set_cookie(
        COOKIE, tok, max_age=SESSION_DAYS * 86400, httponly=True, samesite="lax",
        secure=get_settings().secure_cookies, path="/",
    )


def user(request: Request) -> dict:
    tok = request.cookies.get(COOKIE)
    if not tok:
        raise HTTPException(401, "Entra con tu cuenta de Google")
    r = conn().execute(
        "SELECT s.email,u.name,u.picture FROM sessions s LEFT JOIN users u ON u.email=s.email "
        "WHERE s.token_hash=? AND s.expires>?",
        (thash(tok), now()),
    ).fetchone()
    if not r:
        raise HTTPException(401, "Tu sesión terminó: vuelve a entrar")
    if not allowed(r["email"]):
        raise HTTPException(403, "Tu cuenta ya no tiene acceso")
    return {"email": r["email"], "name": r["name"] or r["email"].split("@")[0], "picture": r["picture"]}


def writer(request: Request, u: dict = Depends(user)) -> dict:
    # Cambios solo desde la propia app: un encabezado propio obliga al navegador a bloquear otros sitios.
    if request.headers.get("x-xs") != "1":
        raise HTTPException(403, "Petición no permitida")
    return u


def role_of(pid: str, email: str) -> tuple[dict, str]:
    if not ID_RE.match(pid):
        raise HTTPException(404, "No existe ese proyecto")
    c = conn()
    p = c.execute("SELECT * FROM projects WHERE id=? AND deleted IS NULL", (pid,)).fetchone()
    if not p:
        raise HTTPException(404, "No existe ese proyecto")
    if p["owner"] == email:
        return dict(p), "owner"
    s = c.execute("SELECT role FROM shares WHERE project_id=? AND email=?", (pid, email)).fetchone()
    if not s:
        raise HTTPException(404, "No existe ese proyecto")
    return dict(p), s["role"]


def lock_info(pid: str) -> dict | None:
    r = conn().execute("SELECT email,name,device,expires FROM locks WHERE project_id=?", (pid,)).fetchone()
    if not r or r["expires"] < now():
        return None
    return {"email": r["email"], "name": r["name"], "device": r["device"]}


# ---------------------------------------------------------------- login
@app.get("/api/health")
def health() -> dict:
    conn().execute("SELECT 1")
    return {"ok": True, "app": "xscript"}


@app.get("/api/me")
def me(u: dict = Depends(user)) -> dict:
    return {"app": "xscript", **u, "owner": u["email"] in get_settings().owner_emails}


@app.get("/api/auth/login")
def login(next: str = "/") -> Response:
    s = get_settings()
    if not s.google_configured:
        return page("Falta configurar el login", "El login con Google todavía no está configurado en el servidor.", 503)
    state, nonce = secrets.token_urlsafe(24), secrets.token_urlsafe(24)
    nxt = next if next.startswith("/") and not next.startswith("//") else "/"
    c = conn()
    c.execute("DELETE FROM authflows WHERE created<?", (now() - 900,))
    c.execute("INSERT INTO authflows VALUES(?,?,?,?)", (thash(state), nonce, nxt, now()))
    return RedirectResponse(get_google().authorize_url(state, nonce), 302)


@app.get("/api/auth/callback")
def callback(code: str | None = None, state: str | None = None, error: str | None = None) -> Response:
    if error:
        return page("No entraste", "Cancelaste el login o Google no lo permitió. Vuelve a intentarlo.", 400)
    if not code or not state:
        return page("Algo salió mal", "Falta información del login. Vuelve a intentarlo.", 400)
    c = conn()
    f = c.execute("SELECT * FROM authflows WHERE state_hash=?", (thash(state),)).fetchone()
    c.execute("DELETE FROM authflows WHERE state_hash=?", (thash(state),))
    if not f or f["created"] < now() - 900:
        return page("El login caducó", "Tardaste mucho o el enlace ya se usó. Vuelve a intentarlo.", 400)
    try:
        ident = get_google().exchange(code)
    except GoogleError:
        return page("Algo salió mal", "Google no confirmó tu cuenta. Vuelve a intentarlo.", 400)
    if ident.nonce != f["nonce"] or not ident.email or not ident.email_verified:
        return page("Algo salió mal", "No pude confirmar tu correo con Google.", 400)
    if not allowed(ident.email):
        return page(
            "Sin acceso",
            f"La cuenta <b>{html.escape(ident.email)}</b> no tiene proyectos en XSCRIPT. Pide que te inviten "
            "con este correo y vuelve a entrar.",
            403,
        )
    resp = RedirectResponse(f["next"] or "/", 302)
    new_session(resp, ident.email, ident.name, ident.picture)
    return resp


@app.get("/api/auth/dev")
def dev_login(email: str) -> Response:
    if not get_settings().dev_login:
        raise HTTPException(404)
    email = email.strip().lower()
    if not allowed(email):
        raise HTTPException(403, "Sin acceso")
    resp = JSONResponse({"ok": True})
    new_session(resp, email, email.split("@")[0])
    return resp


@app.post("/api/auth/logout")
def logout(request: Request) -> Response:
    tok = request.cookies.get(COOKIE)
    if tok:
        conn().execute("DELETE FROM sessions WHERE token_hash=?", (thash(tok),))
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(COOKIE, path="/")
    return resp


# ---------------------------------------------------------------- proyectos
def _gz_json(raw: bytes, gz: bool) -> bytes:
    """Devuelve el JSON comprimido y valida que sea un proyecto."""
    try:
        txt = gzip.decompress(raw) if gz else raw
        o = json.loads(txt)
    except (OSError, ValueError) as e:
        raise HTTPException(400, "El proyecto llegó dañado") from e
    if not isinstance(o, dict) or o.get("app") != "xscript" or not isinstance(o.get("project"), dict):
        raise HTTPException(400, "Eso no es un proyecto de XSCRIPT")
    return raw if gz else gzip.compress(txt, 6)


async def _body(request: Request, limit: int) -> bytes:
    data = bytearray()
    async for chunk in request.stream():
        data += chunk
        if len(data) > limit:
            raise HTTPException(413, "El archivo es demasiado grande")
    return bytes(data)


def _snapshot(pid: str, rev: int, data: bytes, by: str, force: bool = False) -> None:
    c = conn()
    p = c.execute("SELECT last_snap FROM projects WHERE id=?", (pid,)).fetchone()
    if not force and p and now() - (p["last_snap"] or 0) < SNAP_EVERY:
        return
    key = f"snap/{pid}/{rev:07d}.json.gz"
    try:
        storage.put(key, data, "application/gzip")
    except storage.StorageError:
        return
    c.execute("INSERT OR REPLACE INTO snapshots VALUES(?,?,?,?,?,?)", (pid, rev, now(), by, len(data), key))
    c.execute("UPDATE projects SET last_snap=? WHERE id=?", (now(), pid))
    old = c.execute(
        "SELECT rev,key FROM snapshots WHERE project_id=? ORDER BY rev DESC LIMIT -1 OFFSET ?", (pid, SNAP_KEEP)
    ).fetchall()
    for o in old:
        storage.delete(o["key"])
        c.execute("DELETE FROM snapshots WHERE project_id=? AND rev=?", (pid, o["rev"]))


@app.get("/api/projects")
def list_projects(u: dict = Depends(user)) -> list[dict]:
    c = conn()
    rows = c.execute(
        "SELECT p.id,p.name,p.owner,p.updated,p.updated_by,p.size,p.rev, "
        "CASE WHEN p.owner=? THEN 'owner' ELSE s.role END AS role "
        "FROM projects p LEFT JOIN shares s ON s.project_id=p.id AND s.email=? "
        "WHERE p.deleted IS NULL AND (p.owner=? OR s.email IS NOT NULL) ORDER BY p.updated DESC",
        (u["email"], u["email"], u["email"]),
    ).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["lock"] = lock_info(r["id"])
        d["shares"] = c.execute("SELECT COUNT(*) FROM shares WHERE project_id=?", (r["id"],)).fetchone()[0]
        out.append(d)
    return out


@app.post("/api/projects")
async def create_project(request: Request, name: str, u: dict = Depends(writer)) -> dict:
    raw = await _body(request, MAX_PROJECT)
    data = _gz_json(raw, request.headers.get("x-gz") == "1")
    pid = uuid.uuid4().hex[:16]
    name = name.strip()[:200] or "Proyecto"
    t = now()
    conn().execute(
        "INSERT INTO projects(id,owner,name,created,updated,updated_by,rev,data,size) VALUES(?,?,?,?,?,?,?,?,?)",
        (pid, u["email"], name, t, t, u["email"], 1, data, len(data)),
    )
    _snapshot(pid, 1, data, u["email"], force=True)
    return {"id": pid, "rev": 1, "name": name}


@app.get("/api/projects/{pid}")
def get_project(pid: str, u: dict = Depends(user)) -> Response:
    p, role = role_of(pid, u["email"])
    meta = {"id": pid, "name": p["name"], "role": role, "rev": p["rev"], "owner": p["owner"],
            "updated": p["updated"], "updated_by": p["updated_by"], "lock": lock_info(pid)}
    return Response(
        p["data"],
        media_type="application/json",
        headers={"Content-Encoding": "gzip", "X-XS-Meta": json.dumps(meta), "Cache-Control": "no-store"},
    )


@app.get("/api/projects/{pid}/meta")
def project_meta(pid: str, u: dict = Depends(user)) -> dict:
    p, role = role_of(pid, u["email"])
    return {"id": pid, "name": p["name"], "role": role, "rev": p["rev"], "updated": p["updated"],
            "updated_by": p["updated_by"], "lock": lock_info(pid)}


@app.put("/api/projects/{pid}")
async def save_project(request: Request, pid: str, rev: int, device: str, name: str | None = None,
                       force: int = 0, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role == "view":
        raise HTTPException(403, "Solo tienes permiso de lectura")
    lk = lock_info(pid)
    if lk and lk["device"] != device:
        raise HTTPException(423, json.dumps({"msg": "Otra persona tiene el turno de edición", "lock": lk}))
    raw = await _body(request, MAX_PROJECT)
    data = _gz_json(raw, request.headers.get("x-gz") == "1")
    c = conn()
    cur = c.execute("SELECT rev FROM projects WHERE id=?", (pid,)).fetchone()["rev"]
    if rev != cur and not (force and role == "owner"):
        raise HTTPException(409, json.dumps({"msg": "El proyecto cambió en otro lado", "rev": cur,
                                             "updated_by": p["updated_by"]}))
    nrev = cur + 1
    nm = (name or p["name"]).strip()[:200] or p["name"]
    c.execute(
        "UPDATE projects SET data=?,size=?,rev=?,updated=?,updated_by=?,name=? WHERE id=?",
        (data, len(data), nrev, now(), u["email"], nm, pid),
    )
    _snapshot(pid, nrev, data, u["email"])
    return {"rev": nrev, "name": nm}


@app.patch("/api/projects/{pid}")
async def rename_project(request: Request, pid: str, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role == "view":
        raise HTTPException(403, "Solo tienes permiso de lectura")
    body = await request.json()
    nm = str(body.get("name", "")).strip()[:200]
    if not nm:
        raise HTTPException(400, "Falta el nombre")
    conn().execute("UPDATE projects SET name=? WHERE id=?", (nm, pid))
    return {"name": nm}


@app.delete("/api/projects/{pid}")
def delete_project(pid: str, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role != "owner":
        raise HTTPException(403, "Solo el dueño puede borrar el proyecto")
    conn().execute("UPDATE projects SET deleted=? WHERE id=?", (now(), pid))
    return {"ok": True}


@app.post("/api/projects/{pid}/restore")
def restore_deleted(pid: str, u: dict = Depends(writer)) -> dict:
    c = conn()
    p = c.execute("SELECT owner FROM projects WHERE id=? AND deleted IS NOT NULL", (pid,)).fetchone()
    if not p or p["owner"] != u["email"]:
        raise HTTPException(404, "No está en la papelera")
    c.execute("UPDATE projects SET deleted=NULL WHERE id=?", (pid,))
    return {"ok": True}


@app.get("/api/trash")
def trash(u: dict = Depends(user)) -> list[dict]:
    rows = conn().execute(
        "SELECT id,name,deleted FROM projects WHERE owner=? AND deleted IS NOT NULL AND deleted>? ORDER BY deleted DESC",
        (u["email"], now() - 30 * 86400),
    ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------- turno de edición
@app.post("/api/projects/{pid}/lock")
async def take_lock(request: Request, pid: str, device: str, force: int = 0, u: dict = Depends(writer)) -> Response:
    p, role = role_of(pid, u["email"])
    if role == "view":
        return JSONResponse({"ok": False, "role": "view", "lock": lock_info(pid)})
    lk = lock_info(pid)
    if lk and lk["device"] != device and not force:
        return JSONResponse({"ok": False, "lock": lk}, 423)
    if lk and lk["device"] != device and force and role != "owner" and lk["email"] != u["email"]:
        return JSONResponse({"ok": False, "lock": lk, "msg": "Solo el dueño puede quitarle el turno a otra persona"}, 403)
    conn().execute(
        "INSERT OR REPLACE INTO locks VALUES(?,?,?,?,?)", (pid, u["email"], u["name"], device, now() + LOCK_SECS)
    )
    return JSONResponse({"ok": True, "secs": LOCK_SECS, "rev": p["rev"]})


@app.delete("/api/projects/{pid}/lock")
def drop_lock(pid: str, device: str, u: dict = Depends(writer)) -> dict:
    role_of(pid, u["email"])
    conn().execute("DELETE FROM locks WHERE project_id=? AND device=?", (pid, device))
    return {"ok": True}


# ---------------------------------------------------------------- PDFs
@app.put("/api/projects/{pid}/pdf/{vid}")
async def put_pdf(request: Request, pid: str, vid: str, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role == "view":
        raise HTTPException(403, "Solo tienes permiso de lectura")
    if not ID_RE.match(vid):
        raise HTTPException(400, "Versión inválida")
    data = await _body(request, MAX_PDF)
    if not data.startswith(b"%PDF"):
        raise HTTPException(400, "Eso no es un PDF")
    key = f"pdf/{pid}/{vid}-{hashlib.sha256(data).hexdigest()[:16]}.pdf"
    try:
        storage.put(key, data, "application/pdf")
    except storage.StorageError as e:
        raise HTTPException(502, str(e)) from e
    conn().execute("INSERT OR REPLACE INTO pdfs VALUES(?,?,?,?,?)", (pid, vid, key, len(data), now()))
    return {"ok": True, "size": len(data)}


@app.get("/api/projects/{pid}/pdf/{vid}")
def get_pdf(pid: str, vid: str, u: dict = Depends(user)) -> Response:
    role_of(pid, u["email"])
    r = conn().execute("SELECT key FROM pdfs WHERE project_id=? AND vid=?", (pid, vid)).fetchone()
    if not r:
        raise HTTPException(404, "Esa versión no tiene PDF")
    try:
        data = storage.get(r["key"])
    except FileNotFoundError as e:
        raise HTTPException(404, "No encontré el PDF") from e
    except storage.StorageError as e:
        raise HTTPException(502, str(e)) from e
    return Response(data, media_type="application/pdf", headers={"Cache-Control": "private, max-age=31536000, immutable"})


@app.get("/api/projects/{pid}/pdfs")
def list_pdfs(pid: str, u: dict = Depends(user)) -> dict:
    role_of(pid, u["email"])
    rows = conn().execute("SELECT vid,size FROM pdfs WHERE project_id=?", (pid,)).fetchall()
    return {r["vid"]: r["size"] for r in rows}


# ---------------------------------------------------------------- compartir
@app.get("/api/projects/{pid}/shares")
def list_shares(pid: str, u: dict = Depends(user)) -> list[dict]:
    role_of(pid, u["email"])
    rows = conn().execute(
        "SELECT s.email,s.role,u.name,u.last_login FROM shares s LEFT JOIN users u ON u.email=s.email "
        "WHERE s.project_id=? ORDER BY s.created", (pid,)
    ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/projects/{pid}/shares")
async def add_share(request: Request, pid: str, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role != "owner":
        raise HTTPException(403, "Solo el dueño puede invitar")
    body = await request.json()
    email, r = str(body.get("email", "")).strip().lower(), body.get("role", "view")
    if not EMAIL_RE.match(email) or r not in ROLES:
        raise HTTPException(400, "Revisa el correo y el permiso")
    if email == p["owner"]:
        raise HTTPException(400, "Ese correo ya es el dueño")
    conn().execute(
        "INSERT INTO shares VALUES(?,?,?,?) ON CONFLICT(project_id,email) DO UPDATE SET role=excluded.role",
        (pid, email, r, now()),
    )
    return {"ok": True}


@app.delete("/api/projects/{pid}/shares/{email}")
def del_share(pid: str, email: str, u: dict = Depends(writer)) -> dict:
    p, role = role_of(pid, u["email"])
    if role != "owner" and email.lower() != u["email"]:
        raise HTTPException(403, "Solo el dueño puede quitar permisos")
    c = conn()
    c.execute("DELETE FROM shares WHERE project_id=? AND email=?", (pid, email.lower()))
    c.execute("DELETE FROM locks WHERE project_id=? AND email=?", (pid, email.lower()))
    return {"ok": True}


# ---------------------------------------------------------------- historial
@app.get("/api/projects/{pid}/history")
def history(pid: str, u: dict = Depends(user)) -> list[dict]:
    role_of(pid, u["email"])
    rows = conn().execute(
        "SELECT rev,at,by,size FROM snapshots WHERE project_id=? ORDER BY rev DESC LIMIT 200", (pid,)
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/projects/{pid}/history/{rev}")
def history_get(pid: str, rev: int, u: dict = Depends(user)) -> Response:
    role_of(pid, u["email"])
    r = conn().execute("SELECT key FROM snapshots WHERE project_id=? AND rev=?", (pid, rev)).fetchone()
    if not r:
        raise HTTPException(404, "No existe esa copia")
    try:
        data = storage.get(r["key"])
    except (FileNotFoundError, storage.StorageError) as e:
        raise HTTPException(502, "No pude leer esa copia") from e
    return Response(data, media_type="application/json", headers={"Content-Encoding": "gzip"})

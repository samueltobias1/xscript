import gzip
import json

import pytest
from fastapi.testclient import TestClient

H = {"x-xs": "1"}


def bundle(name="Arca", n=1):
    return json.dumps({"app": "xscript", "v": 3, "project": {"meta": {"name": name, "vers": []}, "versions": [], "n": n}}).encode()


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("XS_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("XS_ENV", "test")
    monkeypatch.setenv("XS_DEV_LOGIN", "1")
    monkeypatch.setenv("XS_OWNER_EMAILS", "sam@x.com")
    monkeypatch.setenv("XS_PUBLIC_HOST", "localhost")
    from app import config
    config.get_settings.cache_clear()
    from app.main import app
    return app


def login(app, email):
    c = TestClient(app)
    r = c.get("/api/auth/dev", params={"email": email})
    assert r.status_code == 200, r.text
    return c


def test_flujo_completo(client):
    sam = login(client, "sam@x.com")
    assert sam.get("/api/me").json()["owner"] is True
    # sin encabezado propio no deja escribir
    assert sam.post("/api/projects", params={"name": "Arca"}, content=bundle()).status_code == 403
    r = sam.post("/api/projects", params={"name": "Arca"}, content=gzip.compress(bundle()), headers={**H, "x-gz": "1"})
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    g = sam.get(f"/api/projects/{pid}")
    assert g.json()["app"] == "xscript" and json.loads(g.headers["x-xs-meta"])["role"] == "owner"
    # turno de edición
    assert sam.post(f"/api/projects/{pid}/lock", params={"device": "pc"}, headers=H).json()["ok"]
    r = sam.put(f"/api/projects/{pid}", params={"rev": 1, "device": "pc"}, content=bundle(n=2), headers=H)
    assert r.json()["rev"] == 2
    # revisión vieja -> conflicto
    assert sam.put(f"/api/projects/{pid}", params={"rev": 1, "device": "pc"}, content=bundle(), headers=H).status_code == 409
    # otro dispositivo sin turno
    assert sam.put(f"/api/projects/{pid}", params={"rev": 2, "device": "ipad"}, content=bundle(), headers=H).status_code == 423
    # Marco no entra hasta que lo invitan
    assert TestClient(client).get("/api/auth/dev", params={"email": "marco@x.com"}).status_code == 403
    assert sam.post(f"/api/projects/{pid}/shares", json={"email": "marco@x.com", "role": "view"}, headers=H).json()["ok"]
    marco = login(client, "marco@x.com")
    lst = marco.get("/api/projects").json()
    assert lst[0]["role"] == "view" and lst[0]["lock"]["email"] == "sam@x.com"
    assert marco.put(f"/api/projects/{pid}", params={"rev": 2, "device": "m"}, content=bundle(), headers=H).status_code == 403
    assert marco.post(f"/api/projects/{pid}/lock", params={"device": "m"}, headers=H).json()["role"] == "view"
    # con edición pero sin turno
    sam.post(f"/api/projects/{pid}/shares", json={"email": "marco@x.com", "role": "edit"}, headers=H)
    assert marco.post(f"/api/projects/{pid}/lock", params={"device": "m"}, headers=H).status_code == 423
    assert marco.post(f"/api/projects/{pid}/lock", params={"device": "m", "force": 1}, headers=H).status_code == 403
    sam.delete(f"/api/projects/{pid}/lock", params={"device": "pc"}, headers=H)
    assert marco.post(f"/api/projects/{pid}/lock", params={"device": "m"}, headers=H).json()["ok"]
    assert marco.put(f"/api/projects/{pid}", params={"rev": 2, "device": "m"}, content=bundle(n=3), headers=H).json()["rev"] == 3
    # el dueño puede retomar el turno
    assert sam.post(f"/api/projects/{pid}/lock", params={"device": "pc", "force": 1}, headers=H).json()["ok"]
    # PDF
    assert sam.put(f"/api/projects/{pid}/pdf/v1abc12", content=b"nope", headers=H).status_code == 400
    assert sam.put(f"/api/projects/{pid}/pdf/v1abc12", content=b"%PDF-1.4 hola", headers=H).json()["ok"]
    assert marco.get(f"/api/projects/{pid}/pdf/v1abc12").content == b"%PDF-1.4 hola"
    # historial
    h = sam.get(f"/api/projects/{pid}/history").json()
    assert h and h[-1]["rev"] == 1
    assert sam.get(f"/api/projects/{pid}/history/1").json()["app"] == "xscript"
    # un extraño no ve el proyecto
    sam.post(f"/api/projects/{pid}/shares", json={"email": "otro@x.com", "role": "view"}, headers=H)
    otro = login(client, "otro@x.com")
    sam.delete(f"/api/projects/{pid}/shares/otro@x.com", headers=H)
    assert otro.get(f"/api/projects/{pid}").status_code in (403, 404)
    # papelera
    assert marco.delete(f"/api/projects/{pid}", headers=H).status_code == 403
    assert sam.delete(f"/api/projects/{pid}", headers=H).json()["ok"]
    assert sam.get("/api/projects").json() == []
    assert sam.get("/api/trash").json()[0]["id"] == pid
    assert sam.post(f"/api/projects/{pid}/restore", headers=H).json()["ok"]
    assert len(sam.get("/api/projects").json()) == 1


def test_proyecto_invalido(client):
    sam = login(client, "sam@x.com")
    assert sam.post("/api/projects", params={"name": "x"}, content=b'{"app":"otra"}', headers=H).status_code == 400


def test_sin_sesion(client):
    c = TestClient(client)
    assert c.get("/api/me").status_code == 401
    assert c.get("/api/projects").status_code == 401

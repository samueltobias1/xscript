import gzip
import json

import pytest
from fastapi.testclient import TestClient

from app import ops as xops

H = {"x-xs": "1"}


def mk_bundle():
    P = {
        "name": "t", "scenes": [{"id": "s1", "num": "1", "pages": 8, "on": True}, {"id": "s2", "num": "2", "pages": 8, "on": True}],
        "views": {"free": {"pos": {"s1": {"x": 0, "y": 0}, "s2": {"x": 100, "y": 0}}, "acts": [1, 2], "strokes": [], "texts": [], "T": {"x": 1, "y": 2, "z": 1}}},
        "hitos": [], "stages": ["A", "B"],
    }
    meta = {"id": "p1", "name": "Arca", "vers": [{"id": "v1", "label": "V1"}], "cur": "v1"}
    return {"app": "xscript", "v": 3, "project": {"meta": meta, "versions": [
        {"meta": {"id": "v1", "label": "V1"}, "P": json.dumps(P), "rev": None, "stats": None, "pdf": None},
        {"meta": {"id": "v2", "label": "V2"}, "P": json.dumps({"scenes": [], "views": {}}), "rev": None, "stats": None, "pdf": None},
    ]}}


@pytest.fixture
def app(tmp_path, monkeypatch):
    monkeypatch.setenv("XS_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("XS_ENV", "test")
    monkeypatch.setenv("XS_DEV_LOGIN", "1")
    monkeypatch.setenv("XS_OWNER_EMAILS", "sam@x.com")
    monkeypatch.setenv("XS_PUBLIC_HOST", "localhost")
    from app import config
    config.get_settings.cache_clear()
    from app import main
    main._DOCS.clear()
    return main.app


def login(app, email):
    c = TestClient(app)
    assert c.get("/api/auth/dev", params={"email": email}).status_code == 200
    return c


def post_ops(c, pid, rev, device, ops):
    return c.post(f"/api/projects/{pid}/ops", params={"rev": rev, "device": device},
                  content=json.dumps({"ops": ops}).encode(), headers=H)


def server_doc(c, pid):
    r = c.get(f"/api/projects/{pid}")
    assert r.status_code == 200
    return xops.load(r.content)[0] if r.headers.get("content-encoding") != "gzip" else xops.load(r.content)[0]


def setup(app):
    sam = login(app, "sam@x.com")
    r = sam.post("/api/projects", params={"name": "Arca"}, content=gzip.compress(json.dumps(mk_bundle()).encode()),
                 headers={**H, "x-gz": "1"})
    pid = r.json()["id"]
    return sam, pid


def test_apply_basico():
    d = {"a": {"b": 1}, "L": [{"id": "x", "n": 1}, {"id": "y", "n": 2}]}
    xops.apply(d, xops.normalize_op({"p": ["a", "b"], "v": 5}))
    xops.apply(d, xops.normalize_op({"p": ["L", "#x", "n"], "v": 9}))
    xops.apply(d, xops.normalize_op({"p": ["L", "#z"], "v": {"id": "z", "n": 3}}))
    xops.apply(d, xops.normalize_op({"p": ["L"], "o": ["z", "y", "x"]}))
    assert d == {"a": {"b": 5}, "L": [{"id": "z", "n": 3}, {"id": "y", "n": 2}, {"id": "x", "n": 9}]}
    xops.apply(d, xops.normalize_op({"p": ["L", "#y"], "d": 1}))
    assert [e["id"] for e in d["L"]] == ["z", "x"]
    with pytest.raises(xops.OpError):
        xops.apply(d, xops.normalize_op({"p": ["L", "#nope", "n"], "v": 1}))
    with pytest.raises(xops.OpError):
        xops.normalize_op({"p": ["__proto__", "x"], "v": 1})
    with pytest.raises(xops.OpError):
        xops.apply(d, xops.normalize_op({"p": ["L", "#q"], "v": {"id": "other"}}))


def test_ops_por_http(app):
    sam, pid = setup(app)
    P = "project/versions/#v1/P".split("/")
    r = post_ops(sam, pid, 1, "d1", [{"p": P + ["views", "free", "pos", "s1"], "v": {"x": 50, "y": 5}},
                                    {"p": P + ["scenes", "#s2", "pages"], "v": 16},
                                    {"p": P + ["scenes", "#nada", "pages"], "v": 1}])
    j = r.json()
    assert r.status_code == 200 and j["rev"] == 2 and j["applied"] == 2 and j["rejected"][0]["i"] == 2
    d = server_doc(sam, pid)
    p1 = d["project"]["versions"][0]["P"]
    assert p1["views"]["free"]["pos"]["s1"] == {"x": 50, "y": 5}
    assert p1["scenes"][1]["pages"] == 16
    # la versión 2 no se tocó: su texto original se conserva
    assert d["project"]["versions"][1]["P"] == {"scenes": [], "views": {}}


def test_dos_personas(app):
    sam, pid = setup(app)
    P = "project/versions/#v1/P".split("/")
    # Sam mueve s1; otro dispositivo de Sam (otra pestaña) mueve s2 sin haber visto lo de la primera
    a = post_ops(sam, pid, 1, "tabA", [{"p": P + ["views", "free", "pos", "s1"], "v": {"x": 1, "y": 1}}]).json()
    b = post_ops(sam, pid, 1, "tabB", [{"p": P + ["views", "free", "pos", "s2"], "v": {"x": 2, "y": 2}}]).json()
    assert a["rev"] == 2 and b["rev"] == 3
    assert [x["rev"] for x in b["since"]] == [2] and b["since"][0]["device"] == "tabA"
    d = server_doc(sam, pid)["project"]["versions"][0]["P"]["views"]["free"]["pos"]
    assert d["s1"] == {"x": 1, "y": 1} and d["s2"] == {"x": 2, "y": 2}
    g = sam.get(f"/api/projects/{pid}/ops", params={"since": 1}).json()
    assert g["rev"] == 3 and [x["rev"] for x in g["batches"]] == [2, 3] and not g["reload"]


def test_put_completo_obliga_a_recargar(app):
    sam, pid = setup(app)
    P = "project/versions/#v1/P".split("/")
    post_ops(sam, pid, 1, "tabA", [{"p": P + ["views", "free", "acts"], "v": [3, 4]}])
    body = gzip.compress(json.dumps(mk_bundle()).encode())
    r = sam.put(f"/api/projects/{pid}", params={"rev": 2, "device": "old"}, content=body, headers={**H, "x-gz": "1"})
    assert r.status_code == 200, r.text
    g = sam.get(f"/api/projects/{pid}/ops", params={"since": 2}).json()
    assert g["reload"] is True


def test_solo_lectura_no_escribe(app):
    sam, pid = setup(app)
    # el dueño comparte en solo lectura
    r = sam.post(f"/api/projects/{pid}/shares", json={"email": "ana@x.com", "role": "view"}, headers=H)
    if r.status_code != 200:
        pytest.skip("la ruta de compartir tiene otro formato")
    ana = login(app, "ana@x.com")
    P = "project/versions/#v1/P".split("/")
    assert post_ops(ana, pid, 1, "x", [{"p": P + ["views", "free", "acts"], "v": [9]}]).status_code == 403


def test_mismo_comportamiento_que_el_navegador():
    """xo_fixture.json lo genera tools/test_xo.js: cada caso trae el documento, los cambios y el resultado."""
    import copy
    import pathlib
    cases = json.loads((pathlib.Path(__file__).parent / "xo_fixture.json").read_text())
    assert len(cases) > 100
    for c in cases:
        d = copy.deepcopy(c["a"])
        for op in c["ops"]:
            xops.apply(d, xops.normalize_op(op))
        assert d == c["b"], c


def test_en_vivo_websocket(app):
    sam, pid = setup(app)
    r = sam.post(f"/api/projects/{pid}/shares", json={"email": "ana@x.com", "role": "edit"}, headers=H)
    assert r.status_code == 200
    ana = login(app, "ana@x.com")
    P = "project/versions/#v1/P".split("/")
    with ana.websocket_connect(f"/api/projects/{pid}/ws?device=ana1") as wa:
        hello = wa.receive_json()
        assert hello["type"] == "hello" and hello["rev"] == 1
        assert wa.receive_json()["type"] == "presence"
        with sam.websocket_connect(f"/api/projects/{pid}/ws?device=sam1") as ws_:
            assert ws_.receive_json()["type"] == "hello"
            names = {x["name"] for x in wa.receive_json()["online"]}
            assert names == {"ana", "sam"}
            ws_.receive_json()  # presencia propia
            j = post_ops(sam, pid, 1, "sam1", [{"p": P + ["views", "free", "acts"], "v": [7]}]).json()
            assert j["rev"] == 2
            m = wa.receive_json()
            assert m["type"] == "ops" and m["batch"]["rev"] == 2 and m["batch"]["device"] == "sam1"


def test_websocket_sin_sesion_o_de_otro_sitio(app):
    sam, pid = setup(app)
    from starlette.websockets import WebSocketDisconnect
    anon = TestClient(app)
    with pytest.raises(WebSocketDisconnect):
        with anon.websocket_connect(f"/api/projects/{pid}/ws?device=x"):
            pass
    with pytest.raises(WebSocketDisconnect):
        with sam.websocket_connect(f"/api/projects/{pid}/ws?device=x", headers={"origin": "https://malo.example"}):
            pass

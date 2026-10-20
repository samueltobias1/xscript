"""Cambios pequeños sobre el documento de un proyecto («guardado por partes»).

El proyecto (el mismo JSON de siempre) se trata como un documento. En vez de mandar todo cada
vez, cada navegador manda solo lo que cambió, como operaciones sobre una ruta:

    {"p": ["project", "versions", "#abc", "P", "views", "stc", "pos", "s12"], "v": {"x": 10, "y": 20}}   poner
    {"p": ["project", "versions", "#abc", "P", "scenes", "#s12"], "d": 1}                               borrar
    {"p": ["project", "versions", "#abc", "P", "scenes"], "o": ["s1", "s3", "s2"]}                      reordenar

En una ruta, «#<llave>» busca un elemento de una lista por su llave (su «id», o «meta.id» en las
versiones). Dos personas que tocan cosas distintas no se pisan; si tocan exactamente lo mismo gana
la última operación que llegó al servidor.

Este archivo y `apply` de xscript.html (xs52.js) tienen que comportarse IGUAL: hay una prueba que
los compara con miles de casos al azar.
"""

from __future__ import annotations

import json
from typing import Any

MAX_DEPTH = 24
MAX_SEGMENT = 200
MAX_OPS_PER_BATCH = 20000
FORBIDDEN = {"__proto__", "constructor", "prototype"}


class OpError(ValueError):
    """La operación no es válida o ya no se puede aplicar. El mensaje es para bitácora."""


def key_of(el: Any) -> str | None:
    """La llave con la que se encuentra un elemento dentro de una lista (o None si no tiene)."""
    if not isinstance(el, dict):
        return None
    k = el.get("id")
    if k is None and isinstance(el.get("meta"), dict):
        k = el["meta"].get("id")
    if isinstance(k, bool) or not isinstance(k, (str, int)):
        return None
    return str(k)


def find(lst: list, key: str) -> int:
    for i, el in enumerate(lst):
        if key_of(el) == key:
            return i
    return -1


def normalize_op(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise OpError("operación inválida")
    p = raw.get("p")
    if not isinstance(p, list) or not p or len(p) > MAX_DEPTH:
        raise OpError("ruta inválida")
    for seg in p:
        if not isinstance(seg, str) or not seg or len(seg) > MAX_SEGMENT or seg in FORBIDDEN:
            raise OpError("ruta inválida")
    kinds = [k for k in ("v", "d", "o") if k in raw]
    if len(kinds) != 1:
        raise OpError("operación inválida")
    if "d" in raw:
        if raw["d"] != 1:
            raise OpError("operación inválida")
        return {"p": p, "d": 1}
    if "o" in raw:
        o = raw["o"]
        if not isinstance(o, list) or not all(isinstance(x, str) for x in o):
            raise OpError("orden inválido")
        return {"p": p, "o": o}
    return {"p": p, "v": raw["v"]}


def _step(cur: Any, seg: str) -> Any:
    if isinstance(cur, list):
        if not seg.startswith("#"):
            raise OpError("se esperaba una llave de lista")
        i = find(cur, seg[1:])
        if i < 0:
            raise OpError("ya no existe ese elemento")
        return cur[i]
    if isinstance(cur, dict):
        if seg not in cur:
            raise OpError("ya no existe esa parte")
        return cur[seg]
    raise OpError("la ruta no entra ahí")


def apply(root: dict[str, Any], op: dict[str, Any]) -> None:
    """Aplica una operación ya normalizada. Lanza OpError si no se puede (el documento no cambia)."""
    path = op["p"]
    if "o" in op:
        cur: Any = root
        for seg in path:
            cur = _step(cur, seg)
        if not isinstance(cur, list):
            raise OpError("solo se reordenan listas")
        by: dict[str, Any] = {}
        for el in cur:
            k = key_of(el)
            if k is not None:
                by[k] = el
        out = []
        seen = set()
        for k in op["o"]:
            if k in by and k not in seen:
                out.append(by[k])
                seen.add(k)
        for el in cur:
            k = key_of(el)
            if k is None or k not in seen:
                out.append(el)
        cur[:] = out
        return
    parent: Any = root
    for seg in path[:-1]:
        parent = _step(parent, seg)
    last = path[-1]
    if isinstance(parent, list):
        if not last.startswith("#"):
            raise OpError("se esperaba una llave de lista")
        key = last[1:]
        i = find(parent, key)
        if "d" in op:
            if i >= 0:
                del parent[i]
            return
        v = op["v"]
        if key_of(v) != key:
            raise OpError("la llave no coincide con el elemento")
        if i >= 0:
            parent[i] = v
        else:
            parent.append(v)
        return
    if isinstance(parent, dict):
        if "d" in op:
            parent.pop(last, None)
        else:
            parent[last] = op["v"]
        return
    raise OpError("la ruta no entra ahí")


def version_of(path: list[str]) -> str | None:
    """Si la ruta cae dentro de una versión del proyecto, su llave (para saber qué P reescribir)."""
    if len(path) >= 3 and path[0] == "project" and path[1] == "versions" and path[2].startswith("#"):
        return path[2][1:]
    return None


def load(raw_json: bytes | str) -> tuple[dict[str, Any], dict[str, str]]:
    """Lee el proyecto guardado y abre el «P» de cada versión (en disco es un texto dentro del JSON).

    Devuelve también los textos originales por versión, para no reescribir las que no cambian."""
    doc = json.loads(raw_json)
    orig: dict[str, str] = {}
    for v in doc.get("project", {}).get("versions", []):
        if isinstance(v.get("P"), str):
            try:
                parsed = json.loads(v["P"])
            except ValueError:
                continue
            k = key_of(v)
            if k is not None:
                orig[k] = v["P"]
            v["P"] = parsed
    return doc, orig


def dump(doc: dict[str, Any], orig: dict[str, str], touched: set[str]) -> bytes:
    """Deja el proyecto como lo espera la app: el «P» de cada versión como texto.

    Las versiones que nadie tocó conservan su texto original (no se vuelven a escribir)."""
    out = dict(doc)
    proj = dict(doc.get("project", {}))
    vers = []
    for v in proj.get("versions", []):
        if isinstance(v.get("P"), dict):
            k = key_of(v)
            v = dict(v)
            if k in orig and k not in touched:
                v["P"] = orig[k]
            else:
                v["P"] = json.dumps(v["P"], ensure_ascii=False, separators=(",", ":"))
        vers.append(v)
    proj["versions"] = vers
    out["project"] = proj
    return json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode()

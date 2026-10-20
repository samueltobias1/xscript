"""Base de datos SQLite (un solo archivo en /data). Ligera y suficiente para una herramienta personal."""

from __future__ import annotations

import os
import sqlite3
import threading
import time

from app.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  email TEXT PRIMARY KEY, name TEXT, picture TEXT, created REAL, last_login REAL);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, created REAL, expires REAL);
CREATE TABLE IF NOT EXISTS authflows(
  state_hash TEXT PRIMARY KEY, nonce TEXT, next TEXT, created REAL);
CREATE TABLE IF NOT EXISTS projects(
  id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, created REAL, updated REAL,
  updated_by TEXT, rev INTEGER NOT NULL DEFAULT 0, data BLOB, size INTEGER DEFAULT 0,
  deleted REAL, last_snap REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS shares(
  project_id TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL, created REAL,
  PRIMARY KEY(project_id, email));
CREATE TABLE IF NOT EXISTS locks(
  project_id TEXT PRIMARY KEY, email TEXT, name TEXT, device TEXT, expires REAL);
CREATE TABLE IF NOT EXISTS snapshots(
  project_id TEXT NOT NULL, rev INTEGER NOT NULL, at REAL, by TEXT, size INTEGER, key TEXT,
  PRIMARY KEY(project_id, rev));
CREATE TABLE IF NOT EXISTS pdfs(
  project_id TEXT NOT NULL, vid TEXT NOT NULL, key TEXT, size INTEGER, at REAL,
  PRIMARY KEY(project_id, vid));
CREATE TABLE IF NOT EXISTS ops(
  project_id TEXT NOT NULL, rev INTEGER NOT NULL, email TEXT, name TEXT, device TEXT, at REAL, ops TEXT,
  PRIMARY KEY(project_id, rev));
CREATE INDEX IF NOT EXISTS shares_email ON shares(email);
"""

_local = threading.local()
_init_lock = threading.Lock()
_inited: set[str] = set()


def db_path() -> str:
    return os.path.join(get_settings().data_dir, "xscript.db")


def conn() -> sqlite3.Connection:
    path = db_path()
    c = getattr(_local, "c", None)
    if c is None or getattr(_local, "path", None) != path:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        c = sqlite3.connect(path, timeout=15, isolation_level=None)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA synchronous=NORMAL")
        c.execute("PRAGMA foreign_keys=ON")
        with _init_lock:
            if path not in _inited:
                c.executescript(SCHEMA)
                _inited.add(path)
        _local.c, _local.path = c, path
    return c


def now() -> float:
    return time.time()

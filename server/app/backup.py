"""Respaldo de la base: copia consistente de SQLite, comprimida, a la nube (o a /data/backups sin nube).

Uso: docker compose exec -T api python -m app.backup
Guarda diarios (30 días) y mensuales (12 meses).
"""

from __future__ import annotations

import gzip
import os
import sqlite3
import sys
import tempfile
from datetime import UTC, datetime

from app import storage
from app.db import conn, db_path


def main() -> int:
    conn()  # asegura que exista
    t = datetime.now(UTC)
    with tempfile.TemporaryDirectory() as d:
        tmp = os.path.join(d, "x.db")
        src, dst = sqlite3.connect(db_path()), sqlite3.connect(tmp)
        with dst:
            src.backup(dst)
        src.close()
        dst.close()
        with open(tmp, "rb") as f:
            data = gzip.compress(f.read(), 6)
    day = f"backups/daily/xscript-{t:%Y-%m-%d}.db.gz"
    storage.put(day, data, "application/gzip")
    if t.day == 1:
        storage.put(f"backups/monthly/xscript-{t:%Y-%m}.db.gz", data, "application/gzip")
    print(f"Respaldo listo: {day} ({len(data) // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

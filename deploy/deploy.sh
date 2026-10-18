#!/usr/bin/env bash
# Actualiza XSCRIPT en el servidor: baja lo último de GitHub, reconstruye y revisa que responda.
# Uso (en el servidor, como usuario xscript):  cd ~/xscript && ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "Falta el archivo .env (copia .env.example y llénalo con: nano .env)"; exit 1; }
git pull --ff-only
docker compose up -d --build --remove-orphans
echo "Esperando a que la app responda…"
for i in $(seq 1 30); do
  if docker compose exec -T api python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=3)" >/dev/null 2>&1; then
    echo "XSCRIPT arriba ✔"
    break
  fi
  sleep 2
  [ "$i" = 30 ] && { echo "La app no respondió. Revisa: docker compose logs api"; exit 1; }
done
# Respaldo diario a las 3:30 (una sola vez)
LINE="30 3 * * * cd $PWD && docker compose exec -T api python -m app.backup >> $HOME/xscript-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'app.backup' ; echo "$LINE" ) | crontab -
docker image prune -f >/dev/null 2>&1 || true
echo "Listo."

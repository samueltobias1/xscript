# XSCRIPT

Herramienta personal de Samuel (Detonante Films) para leer, rayar, hacer breakdown y ordenar guiones
(Revisión · Pizarrón Save the Cat/Arcos · Breakdown), ahora en la nube.

- **App**: `deploy/app/index.html` (un solo HTML; se arma aparte y se copia aquí).
- **Servidor**: `server/` — FastAPI + SQLite. Login con Google, proyectos, permisos (editar / solo lectura),
  turno de edición (un editor a la vez), historial cada 10 min, PDFs en Hetzner Object Storage.
- **Producción**: servidor Hetzner propio `xscript` (178.104.225.216), dominio `xscript.detonantevfx.com`,
  Docker Compose + Caddy (HTTPS automático). Totalmente independiente de Shoter.

## Instalar por primera vez (en el servidor, usuario `xscript`)
```
git clone https://github.com/samueltobias1/xscript.git && cd xscript && cp .env.example .env && nano .env
./deploy/deploy.sh
```

## Actualizar
```
cd ~/xscript && ./deploy/deploy.sh
```

## Respaldos
- Base de datos: diario 3:30 (cron que instala `deploy.sh`) → bucket `backups/daily` (30 días) y `backups/monthly`.
- Historial de cada proyecto: bucket `snap/` (últimas 300 copias).
- Hetzner Backups (foto del disco) activado en el panel.

## Pruebas
```
cd server && pip install -r requirements.txt pytest && python -m pytest -q
```

# XSCRIPT — contexto para Claude

- Dueño: Samuel Tobias (CEO Detonante Films). No es programador; habla español (a veces por dictado). Instrucciones paso a paso, simples, con avisos de riesgo.
- Reglas fijas: nunca pedir ni pegar llaves/tokens/secrets en el chat (van al `.env` del servidor con `nano`). Comandos para PowerShell en **una sola línea**.
- XSCRIPT es independiente de Shoter (repo `samueltobias1/monster`): otro servidor, otro bucket, otro dominio. No mezclar.
- El código de la app (HTML) se arma fuera de este repo (build de XSCRIPT: Rayos X + Script Houdini) y se copia a `deploy/app/index.html`.
- Deploy: `ssh xscript@178.104.225.216` → `cd ~/xscript && ./deploy/deploy.sh`.
- Root solo para mantenimiento del sistema (`ssh root@178.104.225.216`).

## Nota sobre el código fuente (4.2)
Los fuentes de armado (xs1..xs7, hostpatch.py, shpatch.py, build.py) se perdieron al reiniciarse el entorno de trabajo.
`deploy/app/index.html` es ahora la fuente de verdad. Los cambios se aplican con parches sobre ese HTML:
`tools/patch_4_2.py` (+ `xs42.js`, `xs42.css`, `fonts42.css`) transforma la 4.1 en la 4.2 y sirve de ejemplo.
`tools/patch_4_3.py` (+ `xs43.js`, `xs43.css`) aplica el «Proyecto en blanco» sobre la 4.2. Cadena: 4.1 → patch_4_2 → patch_4_3 (el index.html del repo ya trae ambos aplicados; no volver a correrlos).

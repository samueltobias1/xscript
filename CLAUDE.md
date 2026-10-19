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
`tools/patch_4_3.py` (+ `xs43.js`, `xs43.css`) aplica el «Proyecto en blanco» sobre la 4.2. `tools/patch_4_4.py` (+ `xs44.js`, `xs44.css`) rehace el Save the Cat (15 segmentos por acto, zonas ocultables). `tools/patch_4_5.py` hace que copiar/pegar funcione entre ventanas (localStorage `xs-clip`). `tools/patch_4_6.py` (+ `xs46.js`, `xs46.css`) hace los dos pizarrones editables (borde arrastrable, horizontal/vertical, cambiar versión, intercambiar) y da a cada ventana su propio turno (DEV en sessionStorage). Cadena: 4.1 → patch_4_2 → … → patch_4_6 (el index.html del repo ya trae todos aplicados; no volver a correrlos).

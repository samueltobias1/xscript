# XSCRIPT — contexto para Claude

- Dueño: Samuel Tobias (CEO Detonante Films). No es programador; habla español (a veces por dictado). Instrucciones paso a paso, simples, con avisos de riesgo.
- Reglas fijas: nunca pedir ni pegar llaves/tokens/secrets en el chat (van al `.env` del servidor con `nano`). Comandos para PowerShell en **una sola línea**.
- XSCRIPT es independiente de Shoter (repo `samueltobias1/monster`): otro servidor, otro bucket, otro dominio. No mezclar.
- El código de la app (HTML) se arma fuera de este repo (build de XSCRIPT: Rayos X + Script Houdini) y se copia a `deploy/app/index.html`.
- Deploy: `ssh xscript@178.104.225.216` → `cd ~/xscript && ./deploy/deploy.sh`.
- Root solo para mantenimiento del sistema (`ssh root@178.104.225.216`).

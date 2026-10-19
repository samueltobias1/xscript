#!/usr/bin/env python3
"""Aplica 4.6 sobre la 4.5: pizarrones lado a lado editables (estilo Blender) y ventanas sin conflicto. Uso: python3 patch_4_6.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs46.css').read();js=open(here+'/xs46.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.5','Pizarrón · XSCRIPT 4.6')
# --- CSS viejo del pizarrón doble fuera; el nuevo entra al final
for old in ["#xsmid.split #app{top:46%}\n",
 "#cmpw{position:absolute;left:0;right:0;top:0;height:46%;z-index:5;border-bottom:3px solid var(--accent);background:var(--bg)}\n",
 "#cmpw iframe{position:absolute;inset:30px 0 0 0;width:100%;height:calc(100% - 30px);border:0;background:var(--bg)}\n",
 "#cmpw .cmpt{position:absolute;left:0;right:0;top:0;height:30px;display:flex;align-items:center;gap:10px;padding:0 12px;background:var(--panel);border-bottom:1px solid var(--line);font-size:12.5px;color:var(--mute)}\n",
 "#cmpw .cmpt b{color:var(--fg)}#cmpw .cmpt .btn{margin-left:auto;padding:2px 8px;height:22px;border:0;background:none}\n",
 "html.xs-child #xbar,html.xs-child #vtabs,html.xs-child #app>.top,html.xs-child #tools,html.xs-child #selbar,html.xs-child #stkbar,html.xs-child #objbar,html.xs-child #home,html.xs-child #welcome,html.xs-child #xpz{display:none!important}\n",
 "html.xs-child .card{pointer-events:none}\n"]:
    rep(old,"")
i=src.index('/* ===== 4.4');
i=src.rindex('<style',0,i) if False else i
j=src.index('</style>',i);src=src[:j]+css+src[j:]
# --- cmpSplit viejo fuera (el nuevo va en el módulo)
a=src.index('function cmpSplit(){');b=src.index('/* al tocar una tarjeta')
src=src[:a]+src[b:]
# --- el pizarrón hijo ahora se puede editar y devuelve los cambios
rep("if(m.t==='load'){if(m.theme){PR.theme=m.theme;applyTheme()}setProject(m.P);closed=true;document.querySelectorAll('.card').forEach(c=>c.removeAttribute('draggable'))}\n      else if(m.t==='focus'){try{setSel([m.id],[]);focusCard(m.id)}catch(_){}}});",
"""if(m.t==='load'){if(m.theme){PR.theme=m.theme;applyTheme()}setProject(m.P);if(m.view&&m.view!==view){try{setView(m.view)}catch(_){}}
        closed=!!m.ro;document.documentElement.classList.toggle('xs-ro',!!m.ro);
        if(m.ro)document.querySelectorAll('.card').forEach(c=>c.removeAttribute('draggable'));
        CMPLAST=serializeP(P).replace(/"saved":"[^"]*"/,'')}
      else if(m.t==='view'){try{setView(m.v)}catch(_){}}
      else if(m.t==='flush'){cmpSend()}
      else if(m.t==='focus'){try{setSel([m.id],[]);focusCard(m.id)}catch(_){}}});""")
rep("if(CHILD){\n  document.documentElement.classList.add('xs-child');",
"""let CMPLAST='';
function cmpSend(){
  if(!CHILD||closed||!P)return;
  const s=serializeP(P),k=s.replace(/"saved":"[^"]*"/,'');if(k===CMPLAST)return;CMPLAST=k;
  try{parent.postMessage({xs:'cmp',t:'save',P:s},'*')}catch(_){}}
if(CHILD){
  document.documentElement.classList.add('xs-child');XSX.save=cmpSend;""")
# --- cada ventana tiene su propia identidad de turno (antes todas eran «el mismo dispositivo»)
rep("const DEV=(()=>{try{let d=localStorage.getItem('xscript:device');if(!d){d=uid()+uid();localStorage.setItem('xscript:device',d)}return d}catch(_){return 'd'+uid()}})();",
    "const DEV=(()=>{try{let d=sessionStorage.getItem('xscript:win');if(!d){d=uid()+uid();sessionStorage.setItem('xscript:win',d)}return d}catch(_){return 'd'+uid()}})();")
rep("toast((CL.lock&&CL.lock.name||'Otra persona')+' está editando este proyecto. Lo ves en lectura; arriba puedes pedir el turno.',5500)",
    "toast(CL.lock&&CL.user&&CL.lock.email===CL.user.email?'Este proyecto está abierto para editar en otra ventana tuya. Aquí lo ves en lectura y se actualiza solo; arriba puedes tomar el turno.':(CL.lock&&CL.lock.name||'Otra persona')+' está editando este proyecto. Lo ves en lectura; arriba puedes pedir el turno.',6500)")
rep("pollT=setInterval(watchMeta,20000)","pollT=setInterval(watchMeta,5000)")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

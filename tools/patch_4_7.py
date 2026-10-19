#!/usr/bin/env python3
"""Aplica 4.7 sobre la 4.6: notas tipo post-it. Uso: python3 patch_4_7.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs47.css').read();js=open(here+'/xs47.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.6','Pizarrón · XSCRIPT 4.7')
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# los post-its nuevos: letra limpia y chica, derechos, con ancho fijo
rep("{t:'NOTA',st:'note',f:'hand',s:36,bg:'#ffe66d',c:'#1a1a1a',rot:-3}","{t:'Nota',st:'note',f:'sans',s:18,w:200,bg:'#ffe66d',c:'#1a1a1a',rot:0}")
rep("{t:'IDEA',st:'note',f:'hand',s:36,bg:'#8ecae6',c:'#12263a',rot:2}","{t:'Idea',st:'note',f:'sans',s:18,w:200,bg:'#8ecae6',c:'#12263a',rot:0}")
rep("o.s=Math.round((p.s||32)*k);","o.s=Math.round((p.s||32)*k);if(o.w)o.w=Math.round(o.w*k);")
# el aviso de «pizarrón en blanco» se quita en cuanto pones cualquier cosa
rep("eb.hidden=!(P&&P.scenes.length===0&&view!=='arcs'&&XSX.mode==='piz')","eb.hidden=!(P&&P.scenes.length===0&&!V().texts.length&&!V().strokes.length&&view!=='arcs'&&XSX.mode==='piz')")
rep("v.texts.forEach(tx=>textsEl.appendChild(textEl(tx)));\n  XSX.gfr&&XSX.gfr();","v.texts.forEach(tx=>textsEl.appendChild(textEl(tx)));\n  XSX.gfr&&XSX.gfr();XSX.emptyHint&&XSX.emptyHint();")
# al escalar un grupo, el ancho de las notas escala con ellas
rep("{o,x:o.x,y:o.y,s:o.s,fs:o.fs}","{o,x:o.x,y:o.y,s:o.s,fs:o.fs,w:o.w}")
rep("if(o.img||o.e||o.k==='st')o.s=Math.max(8,Math.round(it.s*k));else o.fs=Math.max(6,Math.round((it.fs||20)*k))",
    "if(o.img||o.e||o.k==='st'){o.s=Math.max(8,Math.round(it.s*k));if(it.w)o.w=Math.max(40,Math.round(it.w*k))}else o.fs=Math.max(6,Math.round((it.fs||20)*k))")
# barra: control de ancho para las notas, y B/I por palabra
rep('<label>Tamaño <input type="range" id="gS" min="10" max="220" value="${size}"></label>',
    '<label>Tamaño <input type="range" id="gS" min="10" max="220" value="${size}"></label>${o.st===\'note\'?`<label>Ancho <input type="range" id="gW" min="80" max="600" value="${o.w||Math.max(200,Math.round((o.s||18)*11))}"></label>`:\'\'}')
rep("else if(t.id==='gR')o.rot=+t.value;else return;","else if(t.id==='gR')o.rot=+t.value;else if(t.id==='gW')o.w=+t.value;else return;")
rep("if(a==='b'){upd(o=>{o.b=o.b?0:1});return}if(a==='i'){upd(o=>{o.i=o.i?0:1});return}",
    "if((a==='b'||a==='i')&&XSX.fmt(a))return;if(a==='b'){upd(o=>{o.b=o.b?0:1});return}if(a==='i'){upd(o=>{o.i=o.i?0:1});return}")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

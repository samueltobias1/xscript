#!/usr/bin/env python3
"""Aplica 4.2 (stickers + grupos) sobre deploy/app/index.html (4.1). Uso: python3 patch_4_2.py in.html out.html"""
import sys,re
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/fonts42.css').read()+open(here+'/xs42.css').read()
js=open(here+'/xs42.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old)
    assert n==count,(n,old[:80])
    src=src.replace(old,new)
# versión
rep('Pizarrón · XSCRIPT 4.1','Pizarrón · XSCRIPT 4.2')
# CSS: antes del primer </style> posterior al bloque 4.1
i=src.index('/* ===== 4.1 ===== */');j=src.index('</style>',i)
src=src[:j]+css+src[j:]
# textEl: stickers y tamaño de texto
rep("}else{d.style.color=tx.c;d.textContent=tx.t}d.contentEditable='false';return d}",
    "}else if(tx.k==='st'){XSX.stPaint(d,tx)}else{d.style.color=tx.c;d.textContent=tx.t;if(tx.fs)d.style.fontSize=tx.fs+'px'}d.contentEditable='false';return d}")
# drawInk: recuadro del grupo
rep("  v.texts.forEach(tx=>textsEl.appendChild(textEl(tx)));\n}","  v.texts.forEach(tx=>textsEl.appendChild(textEl(tx)));\n  XSX.gfr&&XSX.gfr();\n}")
# paintSel: expandir grupos y barra
rep("function paintSel(){\n","function paintSel(){\n  XSX.expG&&XSX.expG();\n")
rep("  paintObjBar();\n}\nfunction clearSel()","  paintObjBar();XSX.gbar&&XSX.gbar();\n}\nfunction clearSel()")
# shift-click alterna todo el grupo
rep("if(e.shiftKey){selI.has(id)?selI.delete(id):selI.add(id);paintSel();act=null;return}","if(e.shiftKey){XSX.tog(id);paintSel();act=null;return}")
rep("if(e.shiftKey){selI.has(hit.id)?selI.delete(hit.id):selI.add(hit.id);paintSel();act=null;return}","if(e.shiftKey){XSX.tog(hit.id);paintSel();act=null;return}")
# no tocar barras
rep("e.target.closest('#tools,#zoomui,#selbar,#stkbar,#objbar'))return;","e.target.closest('#tools,#zoomui,#selbar,#stkbar,#objbar,#gbar,#stp'))return;",2)
rep("#tools,#zoomui,#selbar,#objbar,#stkbar{cursor:default}","#tools,#zoomui,#selbar,#objbar,#stkbar,#gbar,#stp{cursor:default}")
# herramienta sticker
rep("  if(tool==='text'){if(tx){editText(tx.dataset.id);return}","  if(tool==='sticker'){XSX.stPlace(w);act=null;return}\n  if(tool==='text'){if(tx){editText(tx.dataset.id);return}")
# duplicar / copiar / pegar con trazos
rep("  (inkIds||[]).forEach(id=>{const t=v.texts.find(x=>x.id===id);if(!t)return;const c=Object.assign(deepc(t),{id:uid(),x:t.x+dx+(dx||dy?0:30),y:t.y+dy+(dx||dy?0:30)});v.texts.push(c);tmap.push(c.id);n++});",
    "  n+=XSX.dupInk(inkIds||[],dx,dy,tmap);")
rep("const ids=[...selC],ink=[...selI].filter(id=>V().texts.some(t=>t.id===id));","const ids=[...selC],ink=[...selI].filter(id=>V().texts.some(t=>t.id===id)||V().strokes.some(t=>t.id===id));",2)
rep("texts:ink.map(id=>deepc(v.texts.find(t=>t.id===id))),imgs:{}};","texts:ink.map(id=>v.texts.find(t=>t.id===id)).filter(Boolean).map(deepc),strokes:ink.map(id=>v.strokes.find(t=>t.id===id)).filter(Boolean).map(deepc),imgs:{}};")
rep("CLIP.texts.forEach(t=>{x0=Math.min(x0,t.x);y0=Math.min(y0,t.y)});","CLIP.texts.forEach(t=>{x0=Math.min(x0,t.x);y0=Math.min(y0,t.y)});(CLIP.strokes||[]).forEach(s=>s.pts.forEach(q=>{x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1])}));XSX.gmapReset();")
rep("    v.texts.push(c);tids.push(c.id)});","    XSX.gmap(c);v.texts.push(c);tids.push(c.id)});\n  (CLIP.strokes||[]).forEach(s=>{const c=deepc(s);c.id=uid();c.pts=s.pts.map(q=>[at.x+(q[0]-x0),at.y+(q[1]-y0)]);XSX.gmap(c);v.strokes.push(c);tids.push(c.id)});")
# módulo antes del arranque
rep("/* ================= arranque ================= */\nXSX.boot();", js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src)
print('ok',len(src))

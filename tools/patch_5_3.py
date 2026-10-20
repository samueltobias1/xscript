#!/usr/bin/env python3
"""Aplica 5.3 sobre la 5.2. Uso: python3 patch_5_3.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs53.css').read();js=open(here+'/xs53.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 5.2','Pizarrón · XSCRIPT 5.3')
rep("const XS_APPV='5.2';","const XS_APPV='5.3';")
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# el bloque de 4.6 (dos pizarrones) se reemplaza entero por el de xs53.js
a='/* ================= 4.6 · pizarrones lado a lado';b='/* ================= 4.7 ·'
assert src.count(a)==1 and src.count(b)==1
i=src.index(a);j=src.index(b);src=src[:i]+src[j:]
# la vista dividida ya no depende de «comparar»
rep("  if(!c.on)c.split=false;\n","")
rep("else if(x==='split'){c.split=!c.split;if(c.split&&!c.on){c.on=true;c.base=c.base||defaultBase()}cmpRefresh()}","else if(x==='split'){XSX.splitToggle()}",2)
rep("${c.split?'✓ ':''}Ver los dos pizarrones<small>Arriba la versión anterior (solo lectura), abajo la actual</small>","${SPL.on?'✓ ':''}Ver los dos pizarrones<small>Dos pizarrones a la vez, cada uno editable</small>")
rep("${c.split?'✓ ':''}Ver los dos pizarrones</button>","${SPL.on?'✓ ':''}Ver los dos pizarrones</button>")
rep("c.on=false;c.split=false;cmpRefresh();return}","c.on=false;cmpRefresh();return}",2)
# cuando otra persona cambia el pizarrón de al lado, se refleja
rep("if([...acc.touched].some(v=>v!==curV)&&$('#cmpw')){try{cmpSplit()}catch(_){}}","if($('#cmpw')){try{cmpSplit();XSX.cmpPush([...acc.touched])}catch(_){}}")
# grupos: se mueven con sus dibujos y emojis
rep("act={k:'gmove',id,el:gt,cards,sx:w.x","act={k:'gmove',id,el:gt,cards,ink:(gr.lock?[]:(gr.ink||[]).map(iid=>{const t=v.texts.find(x=>x.id===iid);if(t)return{o:t,x0:t.x,y0:t.y};const s=v.strokes.find(x=>x.id===iid);return s&&{o:s,pts0:s.pts.map(p=>p.slice())}}).filter(Boolean)),sx:w.x")
rep("if(!act.moved||!act.cards.length)break;\n      act.cards.forEach(c=>{c.p.x=c.x0+dx;","if(!act.moved||!((act.cards&&act.cards.length)||(act.ink&&act.ink.length)))break;\n      (act.ink||[]).forEach(q=>{if(q.pts0){q.o.pts=q.pts0.map(p=>{const r=p.slice();r[0]=p[0]+dx;r[1]=p[1]+dy;return r})}else{q.o.x=q.x0+dx;q.o.y=q.y0+dy}});if(act.ink&&act.ink.length)drawInk();\n      act.cards.forEach(c=>{c.p.x=c.x0+dx;")
rep("case'gmove':if(a.moved){if(a.cards.length){pushUndo(a.undo);drawBg()}}","case'gmove':if(a.moved){if(a.cards.length||(a.ink&&a.ink.length)){pushUndo(a.undo);drawBg()}}")
# la barra movible se acomoda al contenedor actual (cuando la barra pasa a la vista dividida)
rep("const bd=tools.offsetParent||tools.parentElement;\n  const place=(x,y)=>{const r=bd.getBoundingClientRect()","const bdf=()=>tools.offsetParent||tools.parentElement;\n  const place=(x,y)=>{const r=bdf().getBoundingClientRect()")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

#!/usr/bin/env python3
"""Aplica 4.3 (proyecto en blanco) sobre la 4.2. Uso: python3 patch_4_3.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs43.css').read();js=open(here+'/xs43.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.2','Pizarrón · XSCRIPT 4.3')
i=src.index('/* ===== 4.2 stickers y grupos ===== */');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# tarjetas nuevas valen páginas en proyectos en blanco
rep("text:[],ptxt:'',doc:[{a:'l',h:''}],pages:0,on:true,w:null,stk:[],cm:[],page:null};","text:[],ptxt:'',doc:[{a:'l',h:''}],pages:P.blank?(P.defPg||2):0,on:true,w:null,stk:[],cm:[],page:null};")
# mensaje de pizarrón vacío
rep("  applyFilters();setLinksBtn();hint();\n}","  applyFilters();setLinksBtn();hint();XSX.emptyHint&&XSX.emptyHint();\n}")
# ver todo con el pizarrón vacío
rep("  if(x0>x1)return;const W=board.clientWidth-90,Hh=board.clientHeight-70,t=T();","  if(y1<y0)y1=y0+520;if(x0>x1)return;const W=board.clientWidth-90,Hh=board.clientHeight-70,t=T();")
# Home en la nube: botón y acción
old='<div class="hb"><button class="btn pri" data-h="new">Nuevo proyecto (PDF del guion)</button><button class="btn" data-h="up">Subir un .json</button></div>\n  <h3>Mis proyectos</h3>'
assert src.count(old)==1,src.count(old)
src=src.replace(old,'<div class="hb"><button class="btn pri" data-h="new">Nuevo proyecto (PDF del guion)</button><button class="btn" data-h="blank">Proyecto en blanco</button><button class="btn" data-h="up">Subir un .json</button></div>\n  <h3>Mis proyectos</h3>')
rep("Aún no tienes proyectos. Crea uno con el PDF de tu guion, o sube el .json de un proyecto que ya tengas.","Aún no tienes proyectos. Crea uno con el PDF de tu guion, empieza uno en blanco, o sube el .json de un proyecto que ya tengas.")
rep("  if(a==='up'){$('#xsJson').click();return}\n  if(a==='recover')","  if(a==='up'){$('#xsJson').click();return}\n  if(a==='blank'){XSX.blankProject();return}\n  if(a==='recover')")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

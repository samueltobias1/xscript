#!/usr/bin/env python3
"""Aplica 5.1 sobre la 5.0. Uso: python3 patch_5_1.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs51.css').read();js=open(here+'/xs51.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 5.0','Pizarrón · XSCRIPT 5.1')
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
rep('<button data-x="add">＋ Nueva versión (PDF)…<small>Otro guion: se crea su propia pestaña</small></button>','<button data-x="add">＋ Nueva versión (PDF)…<small>Otro guion: se crea su propia pestaña</small></button>\n   <button data-x="blank">＋ Pizarrón en blanco<small>Sin guion ni PDF: empiezas con tarjetas tuyas</small></button>')
rep("if(x==='add'){pendingPdf='ver';$('#xsPdf').click();return}","if(x==='add'){pendingPdf='ver';$('#xsPdf').click();return}\n    if(x==='blank'){addBlankVersion();return}")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

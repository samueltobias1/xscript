#!/usr/bin/env python3
"""Aplica 5.0 sobre la 4.9. Uso: python3 patch_5_0.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
js=open(here+'/xs50.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.9','Pizarrón · XSCRIPT 5.0')
rep("const cx=id=>{const s=byId(id);return s&&s.on?(sp[id]+s.pages/tot*50)/100*W:null};","const cx=id=>{const s=byId(id),r=s&&s.on&&tkR(s);return r?(r.a+r.b)/2/100*W:null};")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

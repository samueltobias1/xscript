#!/usr/bin/env python3
"""Aplica 5.2 sobre la 5.1. Uso: python3 patch_5_2.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
js=open(here+'/xs52_core.js').read()+"\n"+open(here+'/xs52.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 5.1','Pizarrón · XSCRIPT 5.2')
rep("const XS_APPV='5.1';","const XS_APPV='5.2';")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

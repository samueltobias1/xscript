#!/usr/bin/env python3
"""Aplica 5.4 sobre la 5.3 (panel de invitados del dueño). Uso: python3 patch_5_4.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs54.css').read();js=open(here+'/xs54.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 5.3','Pizarrón · XSCRIPT 5.4')
rep("const XS_APPV='5.3';","const XS_APPV='5.4';")
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# botón «Invitados» solo para el dueño del servidor
rep('<span class="huser">${CL.user.picture','${CL.user.owner?\'<button class="btn" data-h="adm">Invitados</button>\':\'\'}<span class="huser">${CL.user.picture')
rep("  if(a==='login'){location.href='/api/auth/login?next='","  if(a==='adm'){XSX.adminDlg();return}\n  if(a==='login'){location.href='/api/auth/login?next='")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

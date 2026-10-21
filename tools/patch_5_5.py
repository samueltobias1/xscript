#!/usr/bin/env python3
"""Aplica 5.5 sobre la 5.4 (dashboard de producción en Breakdown). Uso: python3 patch_5_5.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs55.css').read();js=open(here+'/xs55.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 5.4','Pizarrón · XSCRIPT 5.5')
rep("const XS_APPV='5.4';","const XS_APPV='5.5';")
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# Breakdown manda también cada elemento con su escena (para el dashboard)
rep("const byDept={},tot={cost:0,lock:0,bd:0,com:0,pend:0,aj:0};","const els=[],byDept={},tot={cost:0,lock:0,bd:0,com:0,pend:0,aj:0};")
rep("if(c){const d=(g.bd&&g.bd.dept)||'Sin depto';byDept[d]=(byDept[d]||0)+c;}","if(c){const d=(g.bd&&g.bd.dept)||'Sin depto';byDept[d]=(byDept[d]||0)+c;}\n        els.push({d:(g.bd&&g.bd.dept)||'Sin depto',e:((g.bd&&g.bd.elem)||'').trim(),s:s?s.idx:-1,c,k});")
rep("return {n:S.n,scenes:sc,tot,byDept,cfg:S.cfg,groups:S.groups.length};","return {n:S.n,scenes:sc,tot,byDept,els,cfg:S.cfg,groups:S.groups.length};")
rep("v.stats={at:Date.now(),n:st.n,scenes:st.scenes,tot:st.tot,byDept:st.byDept,cfg:st.cfg};","v.stats={at:Date.now(),n:st.n,scenes:st.scenes,tot:st.tot,byDept:st.byDept,els:st.els||[],cfg:st.cfg};")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

#!/usr/bin/env python3
"""Aplica 4.8 sobre la 4.7. Uso: python3 patch_4_8.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs48.css').read();js=open(here+'/xs48.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.7','Pizarrón · XSCRIPT 4.8')
i=src.index('/* ===== 4.4');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# las tarjetas nuevas nacen con 1 página (antes 0: no se veían en el timeline ni en Arcos)
rep("pages:P.blank?(P.defPg||2):0,on:true","pages:P.defPg||(P.blank?2:8),on:true")
# Arcos: si las líneas de acto del Pizarrón libre caen todas en el mismo hueco, los actos se empalman; en ese caso se reparten 20/50/80
rep("  return v.acts.map(x=>{let pg=0;P.scenes.forEach(s=>{const p=v.pos[s.id];if(s.on&&p&&p.x+cardW(s)/2<x)pg+=s.pages});const pct=Math.max(prev,pg/tot);prev=pct;return clamp(pct*100,2,98)});",
"""  const arr=v.acts.map(x=>{let pg=0;P.scenes.forEach(s=>{const p=v.pos[s.id];if(s.on&&p&&p.x+cardW(s)/2<x)pg+=s.pages});const pct=Math.max(prev,pg/tot);prev=pct;return clamp(pct*100,2,98)});
  const bad=!arr.length?false:(arr.some((x,i)=>x-(i?arr[i-1]:0)<4)||98-arr[arr.length-1]<2);
  if(bad){const n=arr.length;return n===3?[20,50,80]:arr.map((_,i)=>clamp((i+1)/(n+1)*100,2,98))}
  return arr;""")
rep("window.__xs42={doGroup,doUngroup,oneGroup,bbox,sel,PRE,FONTS};","window.__xs42={doGroup,doUngroup,oneGroup,bbox,sel,PRE,FONTS,STY,COLS};")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

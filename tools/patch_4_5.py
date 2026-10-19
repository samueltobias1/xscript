#!/usr/bin/env python3
"""Aplica 4.5 (copiar/pegar entre ventanas y versiones) sobre la 4.4. Uso: python3 patch_4_5.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.4','Pizarrón · XSCRIPT 4.5')
# al copiar: guardar también en el navegador (lo ven las demás ventanas del mismo navegador)
rep("  CLIP.texts.forEach(t=>{if(t.img&&P.imgData&&P.imgData[t.img])CLIP.imgs[t.img]=P.imgData[t.img]});\n  return true}",
"""  CLIP.texts.forEach(t=>{if(t.img&&P.imgData&&P.imgData[t.img])CLIP.imgs[t.img]=P.imgData[t.img]});
  try{localStorage.setItem('xs-clip',JSON.stringify(CLIP))}catch(_){
    try{localStorage.setItem('xs-clip',JSON.stringify(Object.assign({},CLIP,{imgs:{}})));toast('Copiado (las imágenes grandes solo se pegan en esta ventana)',2600)}catch(__){try{localStorage.removeItem('xs-clip')}catch(___){}}}
  return true}
function loadClip(){try{const j=localStorage.getItem('xs-clip');if(j){const c=JSON.parse(j);if(c&&c.cards&&c.texts){CLIP=c;return true}}}catch(_){}return false}""")
# al pegar: si lo copiado vino de otra ventana, leerlo del navegador
rep("  if(CLIP&&txt.startsWith('XSCRIPT-CLIP:')){e.preventDefault();pasteClip()}});",
"""  if(txt.startsWith('XSCRIPT-CLIP:')){const id=txt.slice(13);if(!CLIP||CLIP.id!==id)loadClip();if(CLIP){e.preventDefault();pasteClip()}}});""")
rep("toast('Copiado: Ctrl+V pega aquí o en otra versión',1600)","toast('Copiado: Ctrl+V pega aquí, en otra versión o en otra ventana',1800)")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

#!/usr/bin/env python3
"""4.4: Save the Cat en una sola fila de 15 segmentos por acto + ocultar zonas. Uso: python3 patch_4_4.py in.html out.html"""
import sys
src=open(sys.argv[1],encoding='utf-8').read()
here=__file__.rsplit('/',1)[0]
css=open(here+'/xs44.css').read();js=open(here+'/xs44.js').read()
def rep(old,new,count=1):
    global src
    n=src.count(old);assert n==count,(n,old[:90]);src=src.replace(old,new)
rep('Pizarrón · XSCRIPT 4.3','Pizarrón · XSCRIPT 4.4')
i=src.index('/* ===== 4.3 proyecto en blanco ===== */');j=src.index('</style>',i);src=src[:j]+css+src[j:]
# 15 segmentos
old="const STC=[['Set-up',0,10,268,'Act I'],['Debate',10,20,252,'Act I'],['Fun and Games',20,50,322,'Act IIA'],['Bad Guys Close In',50,75,190,'Act IIB'],['Dark Night of the Soul',75,80,205,'Act IIB'],['Finale',80,100,92,'Act III']];"
new="""const STC=[['Opening Image',0,2,285,'Act I','m'],['Theme Stated',2,5,275,'Act I','m'],['Set-up',5,10,268,'Act I','s'],['Catalyst',10,12,258,'Act I','m'],['Debate',12,18,250,'Act I','s'],['Break into 2',18,20,240,'Act I','m'],
 ['B Story',20,23,335,'Act IIA','m'],['Fun and Games',23,48,322,'Act IIA','s'],['Midpoint',48,50,310,'Act IIA','m'],
 ['Bad Guys Close In',50,73,190,'Act IIB','s'],['All Is Lost',73,75,200,'Act IIB','m'],['Dark Night of the Soul',75,78,208,'Act IIB','s'],['Break into 3',78,80,218,'Act IIB','m'],
 ['Finale',80,98,92,'Act III','s'],['Final Image',98,100,75,'Act III','m']];
const STC_OLDP=[0,10,20,50,75,80,100],STC_OLDI=[2,4,7,9,11,13];"""
rep(old,new)
# migración de proyectos con las 6 zonas viejas
rep("function ensureGuides(vn){","""function migStc(v){
  const E=v.edges,np=STC.map(d=>d[1]).concat([100]);
  const xAt=p=>{for(let k=0;k<6;k++)if(p<=STC_OLDP[k+1]+1e-9)return E[k]+(p-STC_OLDP[k])/(STC_OLDP[k+1]-STC_OLDP[k])*(E[k+1]-E[k]);return E[6]};
  v.edges=np.map(xAt);
  if(Array.isArray(v.names)&&v.names.length===6){const nn=STC.map(d=>d[0]);v.names.forEach((t,k)=>{nn[STC_OLDI[k]]=t});v.names=nn}
}
function ensureGuides(vn){""")
rep("  if(v.edges&&v.edges.length===BANDS[vn].length+1)return;\n  const defs=BANDS[vn],E=[X0-20];","  if(vn==='stc'&&v.edges&&v.edges.length===7)migStc(v);\n  if(v.edges&&v.edges.length===BANDS[vn].length+1)return;\n  const defs=BANDS[vn],E=[X0-20];")
# bloque de dibujo de bandas
a=src.index("  const BT=isS?150:92;\n  if(isS){let i=0;while(i<n)")
endm="    drawMarkers();drawGroups();\n  }\n}"
b=src.index(endm,a)+len(endm)
blk='''  const BT=isS?150:92,hid=(isS&&v.hid)||{},HV=i=>!!hid[i];
  const ICON={};STC_PTS.forEach(f=>{ICON[f[0]]=f[2]});
  if(isS){let i=0;while(i<n){let j=i;while(j+1<n&&defs[j+1][4]===defs[i][4])j++;
    let a0=i,b0=j;while(a0<=j&&HV(a0))a0++;while(b0>=i&&HV(b0))b0--;
    if(a0<=b0)g('actb',{left:(E[a0]+2)+'px',width:Math.max(8,E[b0+1]-E[a0]-4)+'px',top:(BT-22)+'px',height:'18px',background:bandCol(defs[i][3],.34)},esc(defs[i][4]));i=j+1}}
  let lastVis=-1;
  defs.forEach((d,i)=>{
    if(HV(i))return;lastVis=i;
    const x0=E[i],x1=E[i+1],st=stat[i],w=x1-x0,mom=isS&&d[5]==='m',nm=bandName(view,i);
    let e0=i;while(e0>0&&HV(e0-1))e0--;
    const cls='band'+(mom?' mom':'')+(isS&&w<150?' nar':'')+(isS&&w<64?' vert':'');
    g(cls,{left:(x0+2)+'px',width:Math.max(8,w-4)+'px',top:BT+'px',height:'64px',background:bandCol(d[3],.17),borderTop:'3px solid '+bandCol(d[3])},
      `<b>${esc(nm)}</b><span class="${st.n?'':'empty'}">${isS&&w<150?st.n+' esc':st.n+' esc · '+(st.pg?fmt8(st.pg):'0')+' pág · '+Math.round(st.pg/tot*100)+'%'}</span>`);
    hdl('bt',{left:(x0+8)+'px',top:(BT+4)+'px',width:Math.max(10,Math.min(w-16,200))+'px',height:'18px'},'',{bnd:i});
    g('bline',{left:x0+'px',top:BT+'px',height:(H-BT)+'px'});
    hdl('bh',{left:x0+'px',top:BT+'px',height:'64px'},'',{band:e0});
  });
  {let e1=lastVis+1;hdl('bh',{left:E[lastVis+1]+'px',top:BT+'px',height:'64px'},'',{band:e1});
   g('bline',{left:E[lastVis+1]+'px',top:BT+'px',height:(H-BT)+'px'})}
  // la fórmula como sombra: proporcional al largo actual
  const gy=BT+68;
  defs.forEach((d,i)=>{if(i===0||HV(i))return;const x=px(d[1]);g('ghost',{left:x+'px',top:gy+'px',height:'24px'});if(E[i+1]-E[i]>=44)g('ghostl',{left:x+'px',top:(gy+24)+'px'},d[1]+'%')});
  g('ghostl',{left:(E[0]-8)+'px',top:(gy+24)+'px',transform:'translateX(-100%)'},'fórmula');
  if(isS){
    const fi=defs.findIndex(d=>d[0]==='Finale');
    if(!HV(fi)){const fa=E[fi],FW=E[fi+1]-E[fi],sf=(v.sub&&v.sub.length===4)?v.sub:[.2,.4,.6,.8],bd=[0].concat(sf,[1]);
      FINALE.forEach((t,k)=>g('sub',{left:(fa+bd[k]*FW+2)+'px',width:Math.max(6,(bd[k+1]-bd[k])*FW-4)+'px',top:(gy+46)+'px',background:bandCol(defs[fi][3],.14)},'<i>'+(k+1)+'</i> '+esc(t)));
      sf.forEach((f,k)=>hdl('bh sh',{left:(fa+f*FW)+'px',top:(gy+46)+'px',height:'22px'},'',{sub:k}))}
    drawMarkers();drawGroups();
  }
}'''
src=src[:a]+blk+src[b:]
# subdivisión del Finale en el arrastre
rep("W=v.edges[6]-v.edges[5];","W=v.edges[14]-v.edges[13];")
# reacomodar también muestra todas las zonas
rep("if(v.flagPos)v.flagPos={};autoLayout(view);","if(v.flagPos)v.flagPos={};v.hid={};autoLayout(view);")
# botón Zonas solo en Save the Cat
rep("$('#mkbtn').hidden=view!=='stc';","$('#mkbtn').hidden=view!=='stc';{const zb=$('#zbtn');if(zb)zb.hidden=view!=='stc'}")
rep("/* ================= arranque ================= */\nXSX.boot();",js+"\n/* ================= arranque ================= */\nXSX.boot();")
open(sys.argv[2],'w',encoding='utf-8').write(src);print('ok')

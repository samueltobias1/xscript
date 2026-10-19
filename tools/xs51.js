/* ================= 5.1 · pizarrón en blanco dentro del proyecto, versión de la app visible, barra movible ================= */
const XS_APPV='5.1';

/* ---- A. ＋ Pizarrón en blanco (nueva versión sin PDF) ---- */
async function addBlankVersion(){
  if(!XP||CHILD)return;
  try{if(cloud()&&!CL.canEdit){toast('Este proyecto está abierto en otro lado: aquí solo lectura',4000);return}}catch(_){}
  const nm=await XSX.askVerName('Pizarrón '+(XP.vers.length+1),'Nombre del pizarrón en blanco');if(!nm)return;
  try{
    await flush();
    const dp=(P&&P.defPg)||8;
    const p=finishProject({app:'rayos-x',v:1,name:XP.name,blank:true,defPg:dp,scenes:[],arcs:[],marks:[]});
    const v=mkVer(p,'',XP.vers.length+1,null);v.label=nm;
    XP.vers.push(v);dirty.add(v.id);await flush();
    activate(v);toast(nm+': pizarrón en blanco listo',2800)
  }catch(err){console.error(err);toast(err.message||'No pude crear el pizarrón',4500)}}
{const _b=buildVTabs;buildVTabs=function(){_b();
  const el=document.getElementById('vtabs'),add=document.getElementById('vtAdd');
  if(!el||!add||document.getElementById('vtBlank'))return;
  const b=document.createElement('button');b.className='vt add';b.id='vtBlank';b.textContent='＋ En blanco';
  b.title='Crea un pizarrón nuevo sin guion ni PDF: empiezas con tarjetas tuyas';
  add.after(b)}}
document.getElementById('vtabs').addEventListener('click',e=>{if(e.target.closest('#vtBlank')){e.stopPropagation();addBlankVersion()}},true);
try{buildVTabs()}catch(_){}

/* ---- B. versión de la app junto al nombre ---- */
{const em=document.querySelector('#xbHome .xslogo');
 if(em&&!document.getElementById('xsAppV')){const s=document.createElement('small');s.id='xsAppV';s.textContent='v'+XS_APPV;s.title='Versión de XSCRIPT que tienes cargada';em.parentElement.appendChild(s)}}

/* ---- C. barra de herramientas: sin contorno azul fijo y se puede mover arrastrando el punto ---- */
{const tools=document.getElementById('tools'),h=document.getElementById('thide');
 if(tools&&h&&!h.dataset.m51){h.dataset.m51=1;
  const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
  const bd=tools.offsetParent||tools.parentElement;
  const place=(x,y)=>{const r=bd.getBoundingClientRect(),w=tools.offsetWidth,hh=tools.offsetHeight;
    x=Math.max(4,Math.min(x,r.width-w-4));y=Math.max(4,Math.min(y,r.height-hh-4));
    tools.style.setProperty('--tx',x+'px');tools.style.setProperty('--ty',y+'px');tools.classList.toggle('rt',x>r.width/2);return{x,y}};
  try{const sv=JSON.parse(LS.get('xs51-pos')||'null');if(sv)setTimeout(()=>place(sv.x,sv.y),0)}catch(_){}
  let d=null,moved=false;
  h.addEventListener('pointerdown',e=>{if(e.button)return;d={px:e.clientX,py:e.clientY,x:tools.offsetLeft,y:tools.offsetTop};moved=false;h.setPointerCapture(e.pointerId)});
  h.addEventListener('pointermove',e=>{if(!d)return;const dx=e.clientX-d.px,dy=e.clientY-d.py;
    if(!moved&&Math.hypot(dx,dy)<5)return;moved=true;place(d.x+dx,d.y+dy)});
  const end=()=>{if(!d)return;d=null;if(moved){LS.set('xs51-pos',JSON.stringify({x:tools.offsetLeft,y:tools.offsetTop}));setTimeout(()=>{moved=false},0)}};
  h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end);
  h.addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();e.preventDefault()}h.blur()},true);
 }}

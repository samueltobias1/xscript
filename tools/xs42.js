/* ================= XSCRIPT 4.2 · stickers con letra propia y grupos de objetos ================= */
{
const FONTS={courier:['Courier','"XSCourier",ui-monospace,monospace'],hand:['A mano','"XSHand","Segoe Print",cursive'],marker:['Marcador','"XSMarker","Marker Felt",cursive'],type:['Máquina','"XSType","Courier New",monospace'],poster:['Cartel','"XSPoster",Impact,sans-serif'],serif:['Elegante','"XSSerif",Georgia,serif'],sans:['Normal','system-ui,-apple-system,"Segoe UI",sans-serif']};
const STY=[['plain','Sin fondo',null,null],['note','Nota','#ffe66d','#1a1a1a'],['label','Etiqueta','#ffffff','#111111'],['stamp','Sello',null,'#d62828'],['tag','Píldora','#111111','#ffffff'],['bubble','Globo','#ffffff','#111111'],['hl','Resaltado','#ffe66d','#111111']];
const COLS=['#111111','#ffffff','#ffe66d','#ffd60a','#f4a261','#ef476f','#d62828','#ff8fab','#c77dff','#8ecae6','#4cc9f0','#06d6a0','#2d9d4f','#b7e4c7'];
const PRE=[
 {t:'NOTA',st:'note',f:'hand',s:36,bg:'#ffe66d',c:'#1a1a1a',rot:-3},
 {t:'IDEA',st:'note',f:'hand',s:36,bg:'#8ecae6',c:'#12263a',rot:2},
 {t:'SE QUEDA',st:'stamp',f:'poster',s:46,c:'#2d9d4f',rot:-5},
 {t:'SE QUITA',st:'stamp',f:'poster',s:46,c:'#d62828',rot:4},
 {t:'¿?',st:'bubble',f:'marker',s:38,bg:'#ffffff',c:'#111111'},
 {t:'VFX',st:'tag',f:'courier',s:28,b:1,bg:'#111111',c:'#ffffff'},
 {t:'CHECAR',st:'label',f:'courier',s:26,b:1,bg:'#ffd60a',c:'#111111'},
 {t:'Importante',st:'hl',f:'marker',s:32,bg:'#ffe66d',c:'#111111'},
 {t:'CAMBIO',st:'tag',f:'poster',s:34,bg:'#ef476f',c:'#ffffff'},
 {t:'Título grande',st:'plain',f:'poster',s:72},
 {t:'Máquina de escribir',st:'plain',f:'type',s:30},
 {t:'Elegante',st:'plain',f:'serif',s:42,i:1}];
const V0=()=>V();
const objs=()=>{const v=V();return v.strokes.concat(v.texts)};
const byId2=id=>{const v=V();return v.texts.find(x=>x.id===id)||v.strokes.find(x=>x.id===id)};
const mem=g=>objs().filter(o=>o.gid===g);
const sel=()=>[...selI].map(byId2).filter(Boolean);
const isImg=o=>!!o.img, isEm=o=>!!o.e;

/* ---- pintar un sticker ---- */
XSX.stPaint=(d,tx)=>{
  const f=FONTS[tx.f||'courier']||FONTS.courier;
  d.classList.add('st','st-'+(tx.st||'plain'));
  d.style.fontFamily=f[1];d.style.fontSize=(tx.s||32)+'px';d.style.color=tx.c||'#111';
  d.style.setProperty('--bg',tx.bg||'#ffe66d');
  d.style.fontWeight=tx.b?'700':'400';d.style.fontStyle=tx.i?'italic':'normal';
  if(tx.st==='stamp'||tx.f==='poster')d.style.textTransform=tx.st==='stamp'?'uppercase':'none';
  if(tx.rot)d.style.transform='rotate('+tx.rot+'deg)';
  d.textContent=tx.t;d.insertAdjacentHTML('beforeend','<i class="eh"></i>');
};

/* ---- agrupar: selección con gid ---- */
XSX.expG=()=>{
  if(!selI.size)return;const o=objs();let gs=null;
  for(const x of o)if(x.gid&&selI.has(x.id)){(gs=gs||new Set()).add(x.gid)}
  if(!gs)return;for(const x of o)if(x.gid&&gs.has(x.gid))selI.add(x.id)};
XSX.tog=id=>{
  const o=byId2(id);const ids=o&&o.gid?mem(o.gid).map(x=>x.id):[id];
  const had=selI.has(id);ids.forEach(i=>had?selI.delete(i):selI.add(i));};
function oneGroup(){const a=sel();if(a.length<2)return null;const g=a[0].gid;if(!g||a.some(o=>o.gid!==g))return null;return mem(g).length===a.length?g:null}
function bbox(list){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  list.forEach(o=>{
    if(o.pts){const h=(o.w||2)/2;o.pts.forEach(q=>{x0=Math.min(x0,q[0]-h);y0=Math.min(y0,q[1]-h);x1=Math.max(x1,q[0]+h);y1=Math.max(y1,q[1]+h)})}
    else{const e=textsEl.querySelector('[data-id="'+o.id+'"]');const w=e?e.offsetWidth:o.s||40,h=e?e.offsetHeight:o.s||24;
      x0=Math.min(x0,o.x);y0=Math.min(y0,o.y);x1=Math.max(x1,o.x+w);y1=Math.max(y1,o.y+h)}});
  return x0>1e8?null:{x0,y0,x1,y1,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)}}
function doGroup(){
  const a=sel();if(a.length<2)return;const s0=snapState(),g='g'+uid();a.forEach(o=>o.gid=g);pushUndo(s0);paintSel();
  toast('Agrupado: se mueve, escala y duplica como un solo objeto. Arrastra la esquina para cambiar su tamaño.',4200)}
function doUngroup(){
  const a=sel(),s0=snapState();a.forEach(o=>{delete o.gid});pushUndo(s0);paintSel();toast('Desagrupado: cada cosa vuelve a ser suelta')}
function doDelete(){const s=snapState(),f=V();f.strokes=f.strokes.filter(x=>!selI.has(x.id));f.texts=f.texts.filter(x=>!selI.has(x.id));selI.clear();pushUndo(s);drawInk();paintSel()}

/* ---- recuadro del grupo con esquina para escalar ---- */
const fr=document.createElement('div');fr.id='gfr';fr.hidden=true;fr.innerHTML='<span class="gfl"></span><i class="gfh" title="Arrastra para cambiar el tamaño"></i>';world.appendChild(fr);
XSX.gfr=()=>{
  const g=XSX.mode==='piz'&&view!=='arcs'&&!selC.size?oneGroup():null;
  if(!g){fr.hidden=true;return}
  const bb=bbox(mem(g));if(!bb){fr.hidden=true;return}
  fr.hidden=false;const pad=6;Object.assign(fr.style,{left:(bb.x0-pad)+'px',top:(bb.y0-pad)+'px',width:(bb.w+pad*2)+'px',height:(bb.h+pad*2)+'px'});
  fr.querySelector('.gfl').textContent='Grupo · '+mem(g).length+' objetos'};
let rafF=0;const kick=()=>{if(fr.hidden&&!oneGroup())return;cancelAnimationFrame(rafF);rafF=requestAnimationFrame(XSX.gfr)};
board.addEventListener('pointermove',kick);board.addEventListener('pointerup',kick);
{const fh=fr.querySelector('.gfh');let sc=null;
 fh.addEventListener('pointerdown',e=>{
   e.stopPropagation();e.preventDefault();const g=oneGroup();if(!g)return;const list=mem(g),bb=bbox(list);if(!bb)return;
   fh.setPointerCapture(e.pointerId);
   sc={s0:snapState(),bb,items:list.map(o=>o.pts?{o,pts:o.pts.map(q=>q.slice()),w:o.w}:{o,x:o.x,y:o.y,s:o.s,fs:o.fs}),k:1}});
 fh.addEventListener('pointermove',e=>{
   if(!sc)return;const w=toWorld(e.clientX,e.clientY),b=sc.bb;
   const k=Math.max(.1,Math.min(10,((w.x-b.x0)/b.w+(w.y-b.y0)/b.h)/2));sc.k=k;
   sc.items.forEach(it=>{const o=it.o;
     if(it.pts){o.pts=it.pts.map(q=>[b.x0+(q[0]-b.x0)*k,b.y0+(q[1]-b.y0)*k]);o.w=Math.max(.3,it.w*k)}
     else{o.x=b.x0+(it.x-b.x0)*k;o.y=b.y0+(it.y-b.y0)*k;
       if(o.img||o.e||o.k==='st')o.s=Math.max(8,Math.round(it.s*k));else o.fs=Math.max(6,Math.round((it.fs||20)*k))}});
   drawInk();XSX.gfr()});
 const end=e=>{if(!sc)return;const s=sc;sc=null;if(Math.abs(s.k-1)>.005){pushUndo(s.s0)}};
 fh.addEventListener('pointerup',end);fh.addEventListener('pointercancel',end)}

/* ---- barra de objetos (agrupar / estilo de sticker) ---- */
const gb=document.createElement('div');gb.id='gbar';gb.hidden=true;board.appendChild(gb);
let gSnap=null;
const swatches=(id,cur,none)=>`<span class="obs" id="${id}">${none?`<button data-v="" style="--c:transparent;background:repeating-linear-gradient(45deg,#888 0 2px,transparent 2px 5px)" title="Sin color"${!cur?' aria-pressed="true"':''}></button>`:''}${COLS.map(c=>`<button data-v="${c}" style="--c:${c}" aria-label="${c}"${cur===c?' aria-pressed="true"':''}></button>`).join('')}</span>`;
XSX.gbar=()=>{
  XSX.gfr();
  const a=sel();
  if(!a.length||selC.size||selStk||view==='arcs'||XSX.mode!=='piz'){gb.hidden=true;gb.innerHTML='';return}
  if(a.length>=2){
    const g=oneGroup();
    gb.innerHTML=g
      ?`<b>Grupo · ${a.length} objetos</b><span class="hint2">Se mueven juntos. Arrastra la esquina para cambiar el tamaño.</span><button class="btn" data-g="ungroup">Desagrupar</button><button class="btn" data-g="dup">Duplicar</button><button class="btn" data-g="del">Borrar</button>`
      :`<b>${a.length} objetos</b><button class="btn pri" data-g="group" title="Los junta en un solo objeto: se mueven, escalan y duplican juntos. Sirve para dibujos de varios trazos, imágenes, notas y textos.">🔗 Agrupar / Unir como sticker</button><button class="btn" data-g="dup">Duplicar</button><button class="btn" data-g="del">Borrar</button>`;
    gb.hidden=false;return}
  const o=a[0];
  if(o.gid){gb.innerHTML=`<b>Parte de un grupo</b><span class="hint2">Selecciona el grupo completo para moverlo.</span>`;gb.hidden=true;return}
  const isTxt=!o.pts&&!o.img&&!o.e;
  if(!isTxt){gb.hidden=true;gb.innerHTML='';return}
  const st=o.k==='st',size=st?(o.s||32):(o.fs||20);
  gb.innerHTML=`<b>${st?'Sticker':'Texto'}</b>
   <span class="seg2" id="gF">${Object.entries(FONTS).map(([k,[n,f]])=>`<button class="ff" data-f="${k}" style="font-family:${f.replace(/"/g,"'")}" title="${n}" aria-pressed="${(o.f||'courier')===k}">Aa</button>`).join('')}</span>
   <label>Tamaño <input type="range" id="gS" min="10" max="220" value="${size}"></label>
   <button class="btn" data-g="b" aria-pressed="${!!o.b}" title="Negrita"><b style="color:inherit;text-transform:none;font-size:13px">B</b></button><button class="btn" data-g="i" aria-pressed="${!!o.i}" title="Cursiva"><i style="font-size:13px">I</i></button>
   <span title="Color de la letra">Letra ${swatches('gC',o.c)}</span>
   ${st?`<span class="seg2" id="gT">${STY.map(([k,n])=>`<button data-st="${k}" aria-pressed="${(o.st||'plain')===k}">${n}</button>`).join('')}</span>
   ${['plain','stamp'].includes(o.st||'plain')?'':`<span title="Color del fondo">Fondo ${swatches('gB',o.bg)}</span>`}
   <label>Giro <input type="range" id="gR" min="-90" max="90" value="${o.rot||0}"></label>`:`<button class="btn" data-g="mk" title="Le pone fondo, giro y estilos">Hacer sticker</button>`}
   <button class="btn" data-g="front" title="Ponerlo encima de lo demás">Al frente</button><button class="btn" data-g="dup">Duplicar</button><button class="btn" data-g="del">Borrar</button>`;
  gb.hidden=false;
};
function cur1(){const a=sel();return a.length===1?a[0]:null}
function upd(fn,undo=true){const o=cur1();if(!o)return;const s0=snapState();fn(o);if(undo)pushUndo(s0);drawInk();XSX.gbar()}
gb.addEventListener('pointerdown',e=>e.stopPropagation());
gb.addEventListener('keydown',e=>e.stopPropagation());
gb.addEventListener('input',e=>{const t=e.target,o=cur1();if(!o)return;if(!gSnap)gSnap=snapState();
  if(t.id==='gS'){if(o.k==='st')o.s=+t.value;else o.fs=+t.value}
  else if(t.id==='gR')o.rot=+t.value;else return;
  drawInk();saveSoon()});
gb.addEventListener('change',()=>{if(gSnap){pushUndo(gSnap);gSnap=null;XSX.gbar()}});
gb.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.f){upd(o=>{o.f=b.dataset.f});return}
  if(b.dataset.st){upd(o=>{const d=STY.find(x=>x[0]===b.dataset.st);o.st=d[0];if(d[2])o.bg=d[2];if(d[3])o.c=d[3]});return}
  const sw=b.closest('.obs');
  if(sw&&b.dataset.v!=null){const id=sw.id;upd(o=>{if(id==='gC')o.c=b.dataset.v||'#111111';else o.bg=b.dataset.v||null});return}
  const a=b.dataset.g;if(!a)return;
  if(a==='group'){doGroup();return}if(a==='ungroup'){doUngroup();return}
  if(a==='del'){doDelete();return}if(a==='dup'){dupSelection();return}
  if(a==='b'){upd(o=>{o.b=o.b?0:1});return}if(a==='i'){upd(o=>{o.i=o.i?0:1});return}
  if(a==='mk'){upd(o=>{o.k='st';o.st='label';o.f=o.f||'courier';o.s=o.fs||24;o.bg='#ffffff';o.c='#111111';delete o.fs});return}
  if(a==='front'){const f=V(),o=cur1();if(o){const s0=snapState();f.texts=f.texts.filter(x=>x!==o).concat(o);pushUndo(s0);drawInk();toast('Al frente')}return}
});

/* ---- copiar / duplicar con trazos y grupos ---- */
XSX.dupInk=(ids,dx,dy,tmap)=>{
  const v=V(),gm={},off=(dx||dy)?0:30;let n=0;
  ids.forEach(id=>{const t=v.texts.find(x=>x.id===id),s=!t&&v.strokes.find(x=>x.id===id),o=t||s;if(!o)return;
    const c=deepc(o);c.id=uid();
    if(t){c.x=t.x+dx+off;c.y=t.y+dy+off}else c.pts=s.pts.map(q=>[q[0]+dx+off,q[1]+dy+off]);
    if(c.gid){gm[c.gid]=gm[c.gid]||('g'+uid());c.gid=gm[c.gid]}
    (t?v.texts:v.strokes).push(c);tmap.push(c.id);n++});
  return n};
let GM={};XSX.gmapReset=()=>{GM={}};
XSX.gmap=c=>{if(c.gid){GM[c.gid]=GM[c.gid]||('g'+uid());c.gid=GM[c.gid]}};

/* ---- paleta de stickers ---- */
const sp=document.createElement('div');sp.id='stp';sp.hidden=true;board.appendChild(sp);
let stArm=null;
function buildSp(){
  sp.innerHTML=`<p>Elige un sticker y toca el pizarrón donde lo quieras. Luego cambia letra, tamaño, color y fondo en la barra de abajo. Doble clic para editar el texto.</p><div class="stg">${PRE.map((p,i)=>`<button data-i="${i}" title="${p.t}"></button>`).join('')}</div>`;
  sp.querySelectorAll('button').forEach(b=>{const p=PRE[+b.dataset.i],d=document.createElement('div');d.className='tx';
    const t=Object.assign({k:'st',c:inkColor},p,{c:p.c||inkColor,rot:0,s:p.s});XSX.stPaint(d,t);d.querySelector('.eh').remove();b.appendChild(d)})}
function openSp(){buildSp();const b=$('#stbtn').getBoundingClientRect(),r=board.getBoundingClientRect();sp.hidden=false;sp.style.left=(b.right-r.left+10)+'px';sp.style.top=Math.max(10,Math.min(b.top-r.top-40,r.height-sp.offsetHeight-12))+'px'}
function closeSp(){sp.hidden=true}
{const tl=$('#tools'),b=document.createElement('button');b.id='stbtn';b.title='Stickers con letra, tamaño y color a tu gusto';b.setAttribute('aria-label','Stickers');
 b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v9l-6 6H5a1 1 0 01-1-1z"/><path d="M14 20v-5a1 1 0 011-1h5"/></svg>';
 tl.insertBefore(b,$('#emobtn').nextSibling);b.onclick=()=>{sp.hidden?openSp():closeSp()}}
sp.addEventListener('pointerdown',e=>e.stopPropagation());
sp.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;stArm=PRE[+b.dataset.i];closeSp();setTool('sticker');toast('Toca el pizarrón donde quieras el sticker',2600)});
document.addEventListener('pointerdown',e=>{if(!sp.hidden&&!e.target.closest('#stp,#stbtn'))closeSp()},true);
XSX.stPlace=w=>{
  if(!stArm)return;const p=stArm,v=V(),s0=snapState();
  const z=T().z,k=Math.max(1,Math.min(5,.6/z)),o=Object.assign({id:uid(),x:w.x-40*k,y:w.y-20*k,k:'st'},p,{c:p.c||inkColor});o.s=Math.round((p.s||32)*k);
  v.texts.push(o);pushUndo(s0);setTool('select');drawInk();setSel([],[o.id]);
  const el=textsEl.querySelector('[data-id="'+o.id+'"]');
  if(el){editText(o.id,true);const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}};
XSX.stArmed=()=>stArm;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sp.hidden){closeSp()}if(e.key==='Escape'&&tool==='sticker')setTool('select')},true);
document.addEventListener('keydown',e=>{
  if(!inPiz()||isTyping(e))return;const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(mod&&k==='g'){e.preventDefault();e.shiftKey?doUngroup():doGroup()}},true);
textsEl.addEventListener('focusout',e=>{const el=e.target.closest&&e.target.closest('.tx');if(!el)return;setTimeout(()=>{const id=el.dataset.id;if(byId2(id)&&!selI.size&&!selC.size)setSel([],[id])},40)});
window.__xs42={doGroup,doUngroup,oneGroup,bbox,sel,PRE,FONTS};
}

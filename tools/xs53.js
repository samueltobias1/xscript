/* ================= 5.3 · notas con iconos, color y emoji en tarjetas, grupos con dibujos, tags pegados al timeline, HOME y vista dividida ================= */
const XS53_IC=(d,w)=>`<svg width="${w||16}" height="${w||16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const XS53_LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};

/* ---------- A. barra de notas: iconos en vez de letras, y justificar ---------- */
{const gb=document.getElementById('gbar'),X=window.__xs42;
 if(gb&&X&&!gb.dataset.i53){gb.dataset.i53=1;
  const ICO={
    size:XS53_IC('<path d="M3 19L9 5l6 14M5 14h8"/><path d="M18 8v8M15.5 10.5L18 8l2.5 2.5M15.5 13.5L18 16l2.5-2.5"/>'),
    width:XS53_IC('<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>'),
    color:XS53_IC('<path d="M12 3c4 5 6 7.5 6 10.5a6 6 0 01-12 0C6 10.5 8 8 12 3z"/>'),
    style:XS53_IC('<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>'),
    font:XS53_IC('<path d="M4 19L9 6l5 13M6 14.5h6"/><path d="M16 19v-7M16 14.5a2.5 2.5 0 110 .01"/>'),
    more:XS53_IC('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
    del:XS53_IC('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    l:XS53_IC('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
    c:XS53_IC('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
    r:XS53_IC('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>')};
  const TIT={size:'Tamaño de la letra',width:'Ancho de la nota',color:'Color',style:'Estilo',font:'Tipo de letra',more:'Más opciones',del:'Borrar'};
  function iconify(){
    if(gb.hidden||!gb.querySelector('[data-pop]'))return;
    const a=X.sel();if(a.length!==1)return;const o=a[0],isNote=o.k==='st'&&o.st==='note';
    gb.classList.add('i53');
    gb.querySelectorAll('label').forEach(l=>{
      const inp=l.querySelector('input');if(!inp||l.dataset.i53)return;
      const k=inp.id==='gSn'?'size':inp.id==='gWn'?'width':null;if(!k)return;
      l.dataset.i53=1;l.title=TIT[k];[...l.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});
      l.insertAdjacentHTML('afterbegin','<span class="gic">'+ICO[k]+'</span>')});
    gb.querySelectorAll('.gpb').forEach(b=>{const k=b.dataset.pop;if(!ICO[k])return;
      b.title=TIT[k];b.setAttribute('aria-label',TIT[k]);
      b.innerHTML=k==='color'?XS53_IC('<circle cx="12" cy="12" r="8" fill="'+(o.c||'currentColor')+'"/>'):ICO[k]});
    const del=gb.querySelector('[data-g="del"]');if(del){del.innerHTML=ICO.del;del.title='Borrar';del.setAttribute('aria-label','Borrar')}
    const ital=gb.querySelector('[data-g="i"]');
    if(isNote&&ital&&!gb.querySelector('[data-al]')){
      const cur=o.al||'c';
      ital.insertAdjacentHTML('afterend',['l','c','r'].map(k=>`<button class="btn" data-al="${k}" aria-pressed="${cur===k}" title="${k==='l'?'Alinear a la izquierda':k==='c'?'Centrar':'Alinear a la derecha'}">${ICO[k]}</button>`).join(''))}}
  const _g=XSX.gbar;XSX.gbar=function(){_g();try{iconify()}catch(e){console.error(e)}};
  gb.addEventListener('click',e=>{const b=e.target.closest('[data-al]');if(!b)return;
    e.stopImmediatePropagation();e.preventDefault();
    const a=X.sel();if(a.length!==1)return;const o=a[0];if(o.al===b.dataset.al)return;
    const s0=snapState();o.al=b.dataset.al;pushUndo(s0);drawInk();saveSoon();XSX.gbar()},true);
  gb.addEventListener('mousedown',e=>{if(e.target.closest('[data-al]'))e.preventDefault()},true);
  const _sp=XSX.stPaint;XSX.stPaint=(d,tx)=>{_sp(d,tx);if(tx.st==='note'&&tx.al)d.style.textAlign=tx.al==='l'?'left':tx.al==='r'?'right':'center'};
 }}

/* ---------- B. tarjetas: color de estatus (línea de arriba) y un emoji a la derecha ---------- */
const STAT53=[['y','#e8b923'],['g','#3cb860'],['r','#ef5350'],['b','#4a90f2']];
{const _b=XSX.badges;
 XSX.badges=(e,s)=>{
   try{_b(e,s)}catch(_){}
   if(s.stat)e.dataset.stat=s.stat;else delete e.dataset.stat;
   let m=e.querySelector(':scope>.cemo');
   if(s.emo){if(!m){m=document.createElement('span');m.className='cemo';e.appendChild(m)}m.textContent=s.emo;e.classList.add('has-emo')}
   else{if(m)m.remove();e.classList.remove('has-emo')}}}
let emoCard53=false;
{const sb=document.getElementById('selbar'),par=sb&&sb.parentElement;
 if(par&&!document.getElementById('cbar53')){
  const cb=document.createElement('div');cb.id='cbar53';cb.hidden=true;
  cb.innerHTML=STAT53.map(([k,c])=>`<button class="cdot" data-st="${k}" style="--c:${c}" title="Color de la tarjeta" aria-label="Color de la tarjeta"></button>`).join('')
   +`<button data-st="" class="cx" title="Quitar el color" aria-label="Quitar el color">${XS53_IC('<path d="M6 6l12 12M18 6L6 18"/>',14)}</button><i class="sep"></i>`
   +`<button data-emo="1" title="Poner un emoji en la tarjeta" aria-label="Emoji de la tarjeta">${XS53_IC('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01"/>',16)}</button>`
   +`<button data-emo="0" class="cx" hidden title="Quitar el emoji" aria-label="Quitar el emoji">${XS53_IC('<path d="M6 6l12 12M18 6L6 18"/>',14)}</button>`
   +`<i class="sep" data-sepg hidden></i><button data-gr="1" hidden title="Agrupa lo seleccionado (tarjetas, dibujos, emojis…) en un recuadro">Agrupar</button>`;
  par.appendChild(cb);
  const selCards=()=>P.scenes.filter(s=>selC.has(s.id));
  cb.addEventListener('pointerdown',e=>e.stopPropagation());
  cb.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;e.stopPropagation();
    if(b.dataset.st!==undefined){const L=selCards();if(!L.length)return;const s0=snapState();
      L.forEach(s=>{if(b.dataset.st)s.stat=b.dataset.st;else delete s.stat});pushUndo(s0);L.forEach(paintCard);paintSel();saveSoon();return}
    if(b.dataset.emo==='0'){const L=selCards();const s0=snapState();L.forEach(s=>{delete s.emo});pushUndo(s0);L.forEach(paintCard);paintSel();saveSoon();return}
    if(b.dataset.emo==='1'){openEmpRaw();emoCard53=true;const m=$('#emp'),r=cb.getBoundingClientRect();m.style.left=Math.max(8,r.left)+'px';m.style.top=(r.bottom+8)+'px';return}
    if(b.dataset.gr){makeGroup()}});
  /* el selector de emojis de siempre sirve también para elegir el de la tarjeta */
  document.addEventListener('click',e=>{
    const b=emoCard53&&e.target.closest&&e.target.closest('#emg button[data-e]');if(!b)return;
    e.stopImmediatePropagation();e.preventDefault();
    const L=P.scenes.filter(s=>selC.has(s.id));emoCard53=false;closeEmp();addRec(b.dataset.e);
    if(!L.length)return;const s0=snapState();L.forEach(s=>{s.emo=b.dataset.e});pushUndo(s0);L.forEach(paintCard);paintSel();saveSoon()},true);
  const inkSel=()=>{const v=stcV();return[...selI].filter(id=>v.texts.some(t=>t.id===id)||v.strokes.some(t=>t.id===id))};
  const _ps=paintSel;
  paintSel=function(){_ps();
    const L=selCards(),ink=view==='stc'?inkSel():[];
    const show=!!L.length||!!ink.length;
    cb.hidden=!show||closed;
    cb.querySelectorAll('[data-st],[data-emo="1"]').forEach(x=>x.hidden=!L.length);
    cb.querySelector('.sep').hidden=!L.length;
    cb.querySelector('[data-emo="0"]').hidden=!L.some(s=>s.emo);
    const gB=cb.querySelector('[data-gr]');gB.hidden=!(view==='stc'&&ink.length&&ink.length+L.length>=2);cb.querySelector('[data-sepg]').hidden=gB.hidden||!L.length;
    const sbv=!sb.hidden;cb.style.top=sbv?'54px':'10px'};
  const _oe=openEmp;openEmp=function(){emoCard53=false;return _oe.apply(this,arguments)};
  window.openEmpRaw=function(){buildEmp();const b=$('#emobtn').getBoundingClientRect(),m=$('#emp');m.hidden=false;emGrid();$('#emq').focus()};
 }}
/* si el selector se cierra sin elegir, la siguiente vez vuelve a ser el de dibujos */
document.addEventListener('pointerdown',e=>{if(emoCard53&&!e.target.closest('#emp,#cbar53'))emoCard53=false},true);

/* ---------- C. grupos del Save the Cat: también pueden llevar dibujos, emojis y textos ---------- */
function inkRect53(id){
  const v=stcV(),t=v.texts.find(x=>x.id===id);
  if(t){const el=textsEl.querySelector(`[data-id="${id}"]`),w=el?el.offsetWidth:(t.s||40),h=el?el.offsetHeight:(t.s||40);return{x:t.x,y:t.y,w:Math.max(w,12),h:Math.max(h,12)}}
  const s=v.strokes.find(x=>x.id===id);
  if(s&&s.pts&&s.pts.length){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;s.pts.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});return{x:x0,y:y0,w:Math.max(x1-x0,12),h:Math.max(y1-y0,12)}}
  return null}
{const _gr=groupRects;
 groupRects=function(gr,pad,skip){const out=_gr(gr,pad,skip);
   (gr.ink||[]).forEach(id=>{if(skip&&skip.has(id))return;const r=inkRect53(id);if(r)out.push({x:r.x-pad,y:r.y-pad,w:r.w+pad*2,h:r.h+pad*2})});return out}}
makeGroup=function(){
  const v=stcV(),ids=P.scenes.filter(s=>selC.has(s.id)).map(s=>s.id),ink=[...selI].filter(id=>v.texts.some(t=>t.id===id)||v.strokes.some(t=>t.id===id));
  if(!ids.length&&!ink.length)return;const s0=snapState();
  v.groups=grps().map(g=>Object.assign(g,{ids:g.ids.filter(i=>!ids.includes(i)),ink:(g.ink||[]).filter(i=>!ink.includes(i))})).filter(g=>g.ids.length||(g.ink||[]).length);
  const gr={id:uid(),n:'Grupo '+(v.groups.length+1),h:GHUES[v.groups.length%8],o:.14,bw:2,lock:false,shape:'env',ids};if(ink.length)gr.ink=ink;
  v.groups.push(gr);pushUndo(s0);selC.clear();selI.clear();selG=gr.id;paintSel();drawBg();paintObjBar(true);
  toast('Grupo creado. Escribe su nombre arriba; ajusta color y opacidad ahí mismo')};
ungroupSel=function(){const v=stcV(),s0=snapState();
  v.groups=grps().map(g=>Object.assign(g,{ids:g.ids.filter(i=>!selC.has(i)),ink:(g.ink||[]).filter(i=>!selI.has(i))})).filter(g=>g.ids.length||(g.ink||[]).length);
  pushUndo(s0);drawBg();paintSel()};
/* el recuadro se acomoda de nuevo cuando mueves un dibujo o emoji que está dentro de un grupo */
board.addEventListener('pointerup',()=>{if(view==='stc'&&grps().some(g=>g.ink&&g.ink.length))setTimeout(()=>{try{drawBg()}catch(_){}},0)},true);

/* ---------- D. tags (markers) pegados al timeline: siguen a su tramo al estirar, recortar u ocultar zonas ---------- */
{const _dm=drawMarkers;
 const reanchor=(v,force)=>{const E=v.edges;if(!E||E.length<2)return;
   (v.markers||[]).forEach(m=>{
     const ok=typeof m.ak==='number'&&m.ak>=0&&m.ak<E.length-1&&typeof m.af==='number';
     if(force||!ok||Math.abs(m.x-(E[m.ak]+m.af*(E[m.ak+1]-E[m.ak])))>1.5){
       let k=0;for(let i=0;i<E.length-1;i++){if(m.x>=E[i])k=i}
       const w=E[k+1]-E[k];m.ak=k;m.af=w>0?(m.x-E[k])/w:0}});
   v.esg=E.map(Math.round).join(',')};
 drawMarkers=function(){
   try{const v=stcV(),E=v.edges;
     if(E&&E.length>1&&(v.markers||[]).length){
       const sig=E.map(Math.round).join(',');
       if(v.esg&&v.esg!==sig){
         v.markers.forEach(m=>{if(typeof m.ak==='number'&&m.ak>=0&&m.ak<E.length-1&&typeof m.af==='number')m.x=Math.round(E[m.ak]+m.af*(E[m.ak+1]-E[m.ak]))});
         v.esg=sig}
       else reanchor(v,false)}}catch(e){console.error(e)}
   return _dm.apply(this,arguments)};
 /* al soltar un marker que moviste a mano, se vuelve a pegar al tramo donde lo dejaste */
 board.addEventListener('pointerup',()=>setTimeout(()=>{try{if(view==='stc')reanchor(stcV(),false)}catch(_){}},0),true)}

/* ---------- E. botón HOME: te lleva al inicio del timeline ---------- */
{const z=document.getElementById('zoomui');
 if(z&&!document.getElementById('homebtn')){
  const b=document.createElement('button');b.id='homebtn';b.dataset.a='home';b.title='Ir al inicio del timeline';b.setAttribute('aria-label','Ir al inicio del timeline');
  b.innerHTML=XS53_IC('<path d="M4 11l8-7 8 7"/><path d="M6 10v10h4v-6h4v6h4V10"/>',16);
  const fit=z.querySelector('[data-a="fit"]');z.insertBefore(b,fit||z.firstChild);
  b.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();
    if(!P)return;
    if(view==='arcs'){const f=z.querySelector('[data-a="fit"]');if(f)f.click();return}
    const t=T(),v=V();let x0=null,y0=null;
    if((view==='stc'||view==='hero')&&v.edges&&v.edges.length){x0=v.edges[0];y0=0}
    else{P.scenes.forEach(s=>{if(!s.on)return;const p=v.pos[s.id];if(!p)return;x0=x0===null?p.x:Math.min(x0,p.x);y0=y0===null?p.y:Math.min(y0,p.y)});if(y0!==null)y0-=60}
    if(x0===null){const f=z.querySelector('[data-a="fit"]');if(f)f.click();return}
    t.x=70-x0*t.z;t.y=24-y0*t.z;world.classList.add('anim');applyT();setTimeout(()=>world.classList.remove('anim'),520);saveSoon()},true);
 }}

/* ---------- F. vista dividida: dos pizarrones a la vez, cada uno editable, con una sola barra de herramientas ---------- */
const SPL={on:false,base:null,dir:'h',pct:null,xp:null,active:'main',busy:false,lastKey:''};
const splA=()=>(SPL.on&&XP&&SPL.xp===XP&&mode==='piz')?verById(SPL.base):null;
const splKey=s=>String(s).replace(/"saved":"[^"]*"/,'');
const splChild=()=>{const w=$('#cmpw');return w&&w.querySelector('iframe')};
const splPost=m=>{try{const f=splChild();f&&f.contentWindow.postMessage(Object.assign({xs:'cmp'},m),'*')}catch(_){}};
function keepT(oldP,newP){try{Object.keys(newP.views||{}).forEach(k=>{const o=oldP&&oldP.views&&oldP.views[k];if(o&&o.T)newP.views[k].T=JSON.parse(JSON.stringify(o.T));else if(newP.views[k])newP.views[k].T=null})}catch(_){}}
function replaceInPlace(dst,src){Object.keys(dst).forEach(k=>delete dst[k]);Object.assign(dst,src)}
function cmpResize(){setTimeout(()=>dispatchEvent(new Event('resize')),30)}
function cmpFlush(cb){const w=$('#cmpw');if(!w){cb();return}try{splPost({t:'flush'})}catch(_){}setTimeout(cb,160)}
const cmpEditable=A=>!!(A&&!A.locked&&(!cloud()||CL.canEdit));
const SPLIT_SVG=XS53_IC('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',16);
function paintSplitBtn(){const b=$('#vSplit');if(b)b.setAttribute('aria-pressed',!!splA())}
XSX.splitToggle=()=>{
  if(!XP||CHILD)return;
  if(mode!=='piz'){toast('La vista dividida es del Pizarrón',2400);return}
  if(SPL.on&&SPL.xp===XP){cmpFlush(()=>{SPL.on=false;cmpRefresh()});return}
  SPL.on=true;SPL.xp=XP;
  if(!SPL.base||!verById(SPL.base))SPL.base=defaultBase()||curV.id;
  cmpRefresh()};
let TOOLS_HOME=null;
function toolsHost(inMid){
  const tl=$('#tools'),mid=$('#xsmid');if(!tl||!mid)return;
  if(inMid&&tl.parentElement===mid)return;if(!inMid&&(!TOOLS_HOME||tl.parentElement===TOOLS_HOME.p))return;
  const r0=tl.getBoundingClientRect();
  if(inMid){if(!TOOLS_HOME)TOOLS_HOME={p:tl.parentElement,n:tl.nextSibling};mid.appendChild(tl)}
  else TOOLS_HOME.p.insertBefore(tl,TOOLS_HOME.n&&TOOLS_HOME.n.parentElement===TOOLS_HOME.p?TOOLS_HOME.n:null);
  const pr=(tl.offsetParent||tl.parentElement).getBoundingClientRect();
  tl.style.setProperty('--tx',Math.max(4,Math.round(r0.left-pr.left))+'px');tl.style.setProperty('--ty',Math.max(4,Math.round(r0.top-pr.top))+'px')}
function cmpSplit(){
  const mid=$('#xsmid');if(!mid||CHILD)return;
  if(SPL.xp!==XP){SPL.on=false;SPL.xp=XP}
  const A=splA();let w=$('#cmpw'),d=$('#cmpd'),l=$('#cmpm');
  if(!A){
    if(w)w.remove();if(d)d.remove();if(l)l.remove();toolsHost(false);
    if(mid.classList.contains('split')){mid.classList.remove('split','sv');mid.style.removeProperty('--sp');cmpResize()}
    paintSplitBtn();return}
  const vert=SPL.dir==='v';
  mid.classList.add('split');mid.classList.toggle('sv',vert);mid.style.setProperty('--sp',(SPL.pct||(vert?50:46))+'%');
  toolsHost(true);
  if(!d){d=document.createElement('div');d.id='cmpd';d.title='Arrastra para cambiar el tamaño';mid.appendChild(d);
    d.addEventListener('pointerdown',e=>{e.preventDefault();d.setPointerCapture(e.pointerId);d.dataset.on='1';mid.classList.add('dragging')});
    d.addEventListener('pointermove',e=>{if(d.dataset.on!=='1')return;const r=mid.getBoundingClientRect(),v=SPL.dir==='v';
      let p=v?(e.clientX-r.left)/r.width:(e.clientY-r.top)/r.height;p=Math.max(.15,Math.min(.85,p))*100;SPL.pct=p;mid.style.setProperty('--sp',p+'%');
      if(!d._t){d._t=setTimeout(()=>{d._t=0;dispatchEvent(new Event('resize'))},60)}});
    const up=()=>{if(d.dataset.on!=='1')return;d.dataset.on='';mid.classList.remove('dragging');cmpResize()};
    d.addEventListener('pointerup',up);d.addEventListener('pointercancel',up);
    d.addEventListener('dblclick',()=>{SPL.pct=null;mid.style.setProperty('--sp',(SPL.dir==='v'?50:46)+'%');cmpResize()})}
  /* encabezado del pizarrón principal: su selector de versión, igual que el del otro lado */
  let m=$('#cmpm');
  if(!m){m=document.createElement('div');m.id='cmpm';m.className='cmpt';mid.appendChild(m)}
  m.innerHTML='<button class="cmpv" id="cmpl" title="Cambiar el pizarrón de este lado"><b>'+esc(curV.label)+'</b> ▾</button><span>'+(cmpEditable(curV)?'editable':'solo lectura')+'</span>';
  m.querySelector('#cmpl').onclick=ev=>{const html=XP.vers.map(v=>`<button data-x="${v.id}">${v.id===curV.id?'● ':'○ '}${esc(v.label)}<small>${esc((v.pdfName||'').replace(/\.pdf$/i,''))}</small></button>`).join('');
    xmenu(ev.currentTarget,html,id=>{const v=verById(id);if(v&&v!==curV)cmpFlush(()=>switchTo(v.id))})};
  paintSplitBtn();
  if(w&&w.dataset.v===A.id){cmpHdr(w,A);return}
  if(w)w.remove();
  w=document.createElement('div');w.id='cmpw';w.dataset.v=A.id;
  w.innerHTML='<div class="cmpt"></div><iframe name="xs-cmp" title="Otro pizarrón"></iframe>';
  mid.insertBefore(w,d);cmpHdr(w,A);
  const fr=w.querySelector('iframe'),ro=!cmpEditable(A);
  const onmsg=e=>{if(e.source!==fr.contentWindow||!e.data||e.data.xs!=='cmp'||e.data.t!=='ready')return;removeEventListener('message',onmsg);
    const src=A===curV?P:A.P;SPL.lastKey=splKey(serializeP(src));
    fr.contentWindow.postMessage({xs:'cmp',t:'load',P:JSON.parse(JSON.stringify(src)),theme:PR.theme,view:view,ro:ro,tool:toolState()},'*')};
  addEventListener('message',onmsg);
  fr.srcdoc=XS_SRC;cmpResize()}
function cmpHdr(w,A){
  const t=w.querySelector('.cmpt'),ro=!cmpEditable(A);
  t.innerHTML='<button class="cmpv" id="cmpv" title="Cambiar el pizarrón de este lado"><b>'+esc(A.label)+'</b> ▾</button><span>'+(ro?'solo lectura':'editable')+'</span>'
   +'<button class="btn" id="cmpsw" title="Intercambiar los dos pizarrones">⇄</button>'
   +'<button class="btn" id="cmpdir" title="Cambiar entre arriba/abajo y lado a lado">'+(SPL.dir==='v'?'⬓':'◫')+'</button>'
   +'<button class="btn" id="cmpx" title="Cerrar la vista dividida">✕</button>';
  t.querySelector('#cmpv').onclick=ev=>{
    const html=XP.vers.map(v=>`<button data-x="${v.id}">${v.id===A.id?'● ':'○ '}${esc(v.label)}<small>${esc((v.pdfName||'').replace(/\.pdf$/i,''))}</small></button>`).join('');
    xmenu(ev.currentTarget,html,id=>{cmpFlush(()=>{SPL.base=id;cmpRefresh()})})};
  t.querySelector('#cmpx').onclick=()=>cmpFlush(()=>{SPL.on=false;cmpRefresh()});
  t.querySelector('#cmpdir').onclick=()=>{SPL.dir=SPL.dir==='v'?'h':'v';SPL.pct=null;cmpSplit();cmpResize()};
  t.querySelector('#cmpsw').onclick=()=>cmpFlush(()=>{const old=curV;SPL.base=old.id;switchTo(A.id)})}
/* el pizarrón de al lado guarda lo que editas ahí; si es la misma versión, también se refleja aquí */
let cmpEdT=0;
addEventListener('message',e=>{
  const m=e.data;if(CHILD||!m||m.xs!=='cmp')return;
  const w=$('#cmpw');if(!w||e.source!==w.querySelector('iframe').contentWindow)return;
  if(m.t==='active'){SPL.active='child';return}
  if(m.t==='busy'){SPL.busy=!!m.v;return}
  if(m.t==='tool'){applyToolState(m.s);return}
  if(m.t!=='save')return;
  const A=verById(w.dataset.v);if(!A||!cmpEditable(A))return;
  let np;try{np=finishProject(JSON.parse(m.P))}catch(err){console.error(err);return}
  SPL.lastKey=splKey(m.P);
  if(A===curV){
    keepT(P,np);replaceInPlace(P,np);P.scenes.forEach(s=>{s._hay=null});U.u.length=0;U.r.length=0;
    try{recountChars();buildCards();recountChars();refreshAll(false)}catch(err){console.error(err)}}
  else A.P=np;
  dirty.add(A.id);schedFlush();try{markDirty()}catch(_){}
  clearTimeout(cmpEdT);cmpEdT=setTimeout(()=>{try{calcDiff();P.scenes.forEach(s=>{try{paintCard(s)}catch(_){}});drawTrack()}catch(_){}},400)});
/* main → hijo: lo que cambias aquí llega al otro pizarrón cuando es la misma versión (o cambió por otra persona) */
let splT=0;
XSX.cmpPush=touched=>{
  const A=splA();if(!A||!splChild())return;
  if(touched&&![...touched].includes(A))return;
  clearTimeout(splT);
  const run=()=>{const A2=splA();if(!A2)return;if(SPL.busy){splT=setTimeout(run,700);return}
    const s=serializeP(A2===curV?P:A2.P),k=splKey(s);if(k===SPL.lastKey)return;SPL.lastKey=k;splPost({t:'sync',P:s})};
  splT=setTimeout(run,650)};
{const _ss=saveSoon;saveSoon=function(){_ss.apply(this,arguments);try{if(!CHILD&&SPL.on&&curV&&SPL.base===curV.id)XSX.cmpPush()}catch(_){}}}
/* una sola barra de herramientas para los dos pizarrones */
const toolState=()=>({tool,inkColor,penPx:XSX.penPx,emArm,emSize});
const toolSig=()=>tool+'|'+inkColor+'|'+XSX.penPx+'|'+emArm+'|'+emSize;
let toolLast='';
function applyToolState(s){
  if(!s)return;
  try{
    if(s.inkColor&&s.inkColor!==inkColor){inkColor=s.inkColor;$$('#swatches .sw').forEach(x=>x.setAttribute('aria-pressed',x.dataset.c===inkColor))}
    if(s.penPx&&XSX.penPx!==s.penPx){XSX.penPx=s.penPx;PR.penPx=s.penPx;const pw=$('#pwbtn i');if(pw){const q=clamp(XSX.penPx*1.7,4,18);pw.style.width=pw.style.height=q+'px'}}
    if(s.emSize)emSize=s.emSize;
    if(s.tool&&s.tool!==tool)setTool(s.tool);
    emArm=s.emArm||null}catch(e){console.error(e)}
  toolLast=toolSig()}
setInterval(()=>{
  if(!CHILD&&!splA())return;
  const sg=toolSig();if(sg===toolLast)return;toolLast=sg;
  if(CHILD){try{parent.postMessage({xs:'cmp',t:'tool',s:toolState()},'*')}catch(_){}}
  else splPost({t:'tool',s:toolState()})},250);
{const _u=undo,_r=redo;
 undo=function(){if(!CHILD&&splA()&&SPL.active==='child'&&splChild()){splPost({t:'undo'});return}return _u.apply(this,arguments)};
 redo=function(){if(!CHILD&&splA()&&SPL.active==='child'&&splChild()){splPost({t:'redo'});return}return _r.apply(this,arguments)}}
document.addEventListener('pointerdown',e=>{if(!CHILD)SPL.active='main'},true);
/* el botón de la barra de versiones */
{const _b=buildVTabs;buildVTabs=function(){_b();
  const dd=$('#vDD');if(!dd||$('#vSplit'))return;
  const b=document.createElement('button');b.id='vSplit';b.className='vsplit';b.title='Vista dividida: dos pizarrones a la vez';b.setAttribute('aria-label','Vista dividida');
  b.setAttribute('aria-pressed',!!splA());b.innerHTML=SPLIT_SVG;dd.after(b)}}
$('#vtabs').addEventListener('click',e=>{const b=e.target.closest('#vSplit');if(!b)return;e.stopImmediatePropagation();e.preventDefault();XSX.splitToggle()},true);
try{buildVTabs()}catch(_){}
/* el pizarrón de al lado sigue la misma vista (Pizarrón, Save the Cat…) */
{const _sv=setView;setView=function(v){_sv(v);try{splPost({t:'view',v:v})}catch(_){}}}
/* ---- lado del hijo ---- */
if(CHILD){
  addEventListener('message',e=>{
    const m=e.data;if(!m||m.xs!=='cmp')return;
    if(m.t==='load'&&m.tool){setTimeout(()=>applyToolState(m.tool),0)}
    else if(m.t==='sync'){
      try{const np=finishProject(JSON.parse(m.P));keepT(P,np);replaceInPlace(P,np);P.scenes.forEach(s=>{s._hay=null});U.u.length=0;U.r.length=0;
        CMPLAST=serializeP(P).replace(/"saved":"[^"]*"/,'');
        recountChars();buildCards();recountChars();refreshAll(false)}catch(err){console.error(err)}}
    else if(m.t==='tool'){applyToolState(m.s)}
    else if(m.t==='undo'){try{undo()}catch(_){}}
    else if(m.t==='redo'){try{redo()}catch(_){}}});
  const say=(t,v)=>{try{parent.postMessage({xs:'cmp',t,v},'*')}catch(_){}};
  document.addEventListener('pointerdown',()=>{say('active');say('busy',1)},true);
  document.addEventListener('pointerup',()=>setTimeout(()=>say('busy',document.activeElement&&document.activeElement.isContentEditable?1:0),300),true);
  document.addEventListener('focusout',()=>setTimeout(()=>say('busy',0),200),true);
  document.addEventListener('keydown',()=>say('busy',1),true);
  document.addEventListener('keyup',()=>setTimeout(()=>say('busy',document.activeElement&&document.activeElement.isContentEditable?1:0),600),true)}
/* ganchos para pruebas */
window.__x53={SPL,get P(){return P},get curV(){return curV},get view(){return view},get tool(){return tool},get inkColor(){return inkColor},verById:id=>verById(id),cmpRefresh:()=>cmpRefresh(),paintCard:s=>paintCard(s),saveSoon:()=>saveSoon(),setTool:t=>setTool(t),stcV:()=>stcV(),drawBg:()=>drawBg(),snapState:()=>snapState(),pushUndo:s=>pushUndo(s),drawInk:()=>drawInk(),setSel:(c,i)=>setSel(c,i),uid:()=>uid(),T:()=>T()};

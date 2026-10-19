/* ================= 4.6 · pizarrones lado a lado (estilo Blender), editables ================= */
function cmpResize(){setTimeout(()=>dispatchEvent(new Event('resize')),30)}
function cmpFlush(cb){const w=$('#cmpw');if(!w){cb();return}try{w.querySelector('iframe').contentWindow.postMessage({xs:'cmp',t:'flush'},'*')}catch(_){}setTimeout(cb,160)}
const cmpEditable=A=>!!(A&&!A.locked&&(!cloud()||CL.canEdit));
function cmpSplit(){
  const mid=$('#xsmid');if(!mid||CHILD)return;
  const c=curV?cmpOf(curV):null,want=!!(c&&c.on&&c.split&&mode==='piz'&&verById(c.base));
  let w=$('#cmpw'),d=$('#cmpd');
  if(!want){if(w)w.remove();if(d)d.remove();const l=$('#cmpl');if(l)l.remove();
    if(mid.classList.contains('split')){mid.classList.remove('split','sv');mid.style.removeProperty('--sp');cmpResize()}return}
  const A=verById(c.base),vert=c.dir==='v';
  mid.classList.add('split');mid.classList.toggle('sv',vert);mid.style.setProperty('--sp',(c.pct||(vert?50:46))+'%');
  if(!d){d=document.createElement('div');d.id='cmpd';d.title='Arrastra para cambiar el tamaño';mid.appendChild(d);
    d.addEventListener('pointerdown',e=>{e.preventDefault();d.setPointerCapture(e.pointerId);d.dataset.on='1';mid.classList.add('dragging')});
    d.addEventListener('pointermove',e=>{if(d.dataset.on!=='1')return;const r=mid.getBoundingClientRect(),cc=cmpOf(curV),v=cc.dir==='v';
      let p=v?(e.clientX-r.left)/r.width:(e.clientY-r.top)/r.height;p=Math.max(.15,Math.min(.85,p))*100;cc.pct=p;mid.style.setProperty('--sp',p+'%');
      if(!d._t){d._t=setTimeout(()=>{d._t=0;dispatchEvent(new Event('resize'))},60)}});
    const up=()=>{if(d.dataset.on!=='1')return;d.dataset.on='';mid.classList.remove('dragging');cmpResize()};
    d.addEventListener('pointerup',up);d.addEventListener('pointercancel',up);
    d.addEventListener('dblclick',()=>{const cc=cmpOf(curV);cc.pct=cc.dir==='v'?50:46;mid.style.setProperty('--sp',cc.pct+'%');cmpResize()})}
  /* etiqueta de la versión actual (la del pizarrón principal) */
  let l=$('#cmpl');if(!l){l=document.createElement('button');l.id='cmpl';mid.appendChild(l);
    l.onclick=()=>{const html=XP.vers.filter(v=>v.id!==cmpOf(curV).base).map(v=>`<button data-x="${v.id}">${v.id===curV.id?'● ':'○ '}${esc(v.label)}</button>`).join('');
      xmenu(l,html,id=>{const v=verById(id);if(v&&v!==curV)cmpFlush(()=>activate(v))})}}
  l.innerHTML='<b>'+esc(curV.label)+'</b> ▾ <small>'+(cmpEditable(curV)?'actual · editable':'solo lectura')+'</small>';
  l.classList.toggle('sv',vert);
  if(w&&w.dataset.v===A.id){cmpHdr(w,A,c);return}
  if(w)w.remove();
  w=document.createElement('div');w.id='cmpw';w.dataset.v=A.id;
  w.innerHTML='<div class="cmpt"></div><iframe name="xs-cmp" title="Otra versión"></iframe>';
  mid.insertBefore(w,d);cmpHdr(w,A,c);
  const fr=w.querySelector('iframe'),ro=!cmpEditable(A);
  const onmsg=e=>{if(e.source!==fr.contentWindow||!e.data||e.data.xs!=='cmp'||e.data.t!=='ready')return;removeEventListener('message',onmsg);
    const P2=JSON.parse(JSON.stringify(A.P));fr.contentWindow.postMessage({xs:'cmp',t:'load',P:P2,theme:PR.theme,view:view,ro:ro},'*')};
  addEventListener('message',onmsg);
  fr.srcdoc=XS_SRC;cmpResize()}
function cmpHdr(w,A,c){
  const t=w.querySelector('.cmpt'),ro=!cmpEditable(A);
  t.innerHTML='<button class="cmpv" id="cmpv" title="Cambiar la versión de este pizarrón"><b>'+esc(A.label)+'</b> ▾</button><span>'+(ro?'solo lectura':'editable')+'</span>'
   +'<button class="btn" id="cmpsw" title="Intercambiar: esta versión pasa al pizarrón principal">⇄</button>'
   +'<button class="btn" id="cmpdir" title="Cambiar entre arriba/abajo y lado a lado">'+(c.dir==='v'?'⬓':'◫')+'</button>'
   +'<button class="btn" id="cmpx" title="Cerrar este pizarrón">✕</button>';
  t.querySelector('#cmpv').onclick=ev=>{
    const html=XP.vers.filter(v=>v.id!==curV.id).map(v=>`<button data-x="${v.id}">${v.id===A.id?'● ':'○ '}${esc(v.label)}<small>${esc((v.pdfName||'').replace(/\.pdf$/i,''))}</small></button>`).join('');
    xmenu(ev.currentTarget,html,id=>{cmpFlush(()=>{c.base=id;cmpRefresh()})})};
  t.querySelector('#cmpx').onclick=()=>cmpFlush(()=>{c.split=false;cmpRefresh()});
  t.querySelector('#cmpdir').onclick=()=>{c.dir=c.dir==='v'?'h':'v';c.pct=c.dir==='v'?50:46;cmpSplit();cmpResize()};
  t.querySelector('#cmpsw').onclick=()=>cmpFlush(()=>{
    const old=curV,n=cmpOf(A);Object.assign(n,{on:true,split:true,base:old.id,only:false,dir:c.dir,pct:c.pct?100-c.pct:null});c.split=false;activate(A)})}
/* el pizarrón de al lado guarda lo que editas aquí */
let cmpEdT=0;
addEventListener('message',e=>{
  const m=e.data;if(CHILD||!m||m.xs!=='cmp'||m.t!=='save')return;
  const w=$('#cmpw');if(!w||e.source!==w.querySelector('iframe').contentWindow)return;
  const A=verById(w.dataset.v);if(!A||!cmpEditable(A))return;
  try{A.P=finishProject(JSON.parse(m.P))}catch(err){console.error(err);return}
  dirty.add(A.id);schedFlush();try{markDirty()}catch(_){}
  clearTimeout(cmpEdT);cmpEdT=setTimeout(()=>{try{calcDiff();P.scenes.forEach(s=>{try{paintCard(s)}catch(_){}});drawTrack()}catch(_){}},400)});
/* el pizarrón de al lado sigue la misma vista (Pizarrón, Save the Cat…) */
{const _sv=setView;setView=function(v){_sv(v);try{const w=$('#cmpw');if(w)w.querySelector('iframe').contentWindow.postMessage({xs:'cmp',t:'view',v:v},'*')}catch(_){}}}

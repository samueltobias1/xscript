/* ================= 4.9 · barra compacta (recientes + ⋯), ocultable; tarjetas de 0 páginas se arreglan solas ================= */

/* ---- A. tarjetas nuevas de 0 páginas: se arreglan solas (sin preguntar) para que el timeline no se pierda ---- */
function zeroFix(){
  if(CHILD)return;
  setTimeout(()=>{
    if(!P||(typeof curV!=='undefined'&&curV&&curV.locked))return;
    try{if(cloud()&&!CL.canEdit)return}catch(_){}
    const z=P.scenes.filter(s=>s.nw&&s.on&&!s.pages);if(!z.length)return;
    const s0=snapState();z.forEach(s=>{s.pages=P.defPg||8});P.zeroAsk=1;pushUndo(s0);
    try{buildCards();recountChars();refreshAll()}catch(e){console.error(e)}
    try{XSX.save&&XSX.save()}catch(_){}
    toast(z.length+(z.length===1?' tarjeta nueva medía':' tarjetas nuevas medían')+' 0 páginas: ahora miden 1 (Ctrl+Z deshace)',5000)},2200)}
{const _a=activate;activate=function(v){_a(v);try{zeroFix()}catch(_){}}}

/* ---- B. barra de herramientas compacta ---- */
{const tools=document.getElementById('tools');
 if(tools&&!tools.dataset.c49){tools.dataset.c49=1;
  const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
  const keyOf=b=>b.dataset.t||b.dataset.a||b.id;
  const core=new Set(['select','hand','undo','redo']);
  const LAB={pen:'Pluma',text:'Texto',emobtn:'Emojis',eraser:'Borrador',pwbtn:'Grosor',imgbtn:'Imagen',stbtn:'Notas'};
  const all=[...tools.children].filter(el=>el.tagName==='BUTTON'&&!core.has(keyOf(el)));
  const byKey={};all.forEach(b=>byKey[keyOf(b)]=b);
  const fly=document.createElement('div');fly.className='tfly';fly.id='tfly';
  all.forEach(b=>{b.classList.add('tb3');if(!b.querySelector('em')){const e=document.createElement('em');e.textContent=LAB[keyOf(b)]||(b.title||'').split(' ')[0];b.appendChild(e)}fly.appendChild(b)});
  // color: un solo punto que abre los colores
  const sw=document.getElementById('swatches');
  const colp=document.createElement('div');colp.className='tcolp';colp.id='tcolp';if(sw)colp.appendChild(sw);
  const dot=document.createElement('button');dot.id='tcolb';dot.title='Color';dot.setAttribute('aria-label','Color');dot.innerHTML='<i></i>';
  const more=document.createElement('button');more.id='tmoreb';more.title='Más herramientas';more.setAttribute('aria-label','Más herramientas');
  more.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  const rec=document.createElement('span');rec.id='trec';rec.style.display='contents';
  const hand=tools.querySelector('[data-t="hand"]');
  hand.after(rec);
  // limpiar separadores viejos y armar el orden nuevo
  tools.querySelectorAll(':scope>hr').forEach(h=>h.remove());
  const hr=()=>document.createElement('hr');
  const undo=tools.querySelector('[data-a="undo"]'),redo=tools.querySelector('[data-a="redo"]');
  rec.after(dot);dot.after(hr());
  tools.appendChild(hr());
  [undo,redo].forEach(b=>b&&tools.appendChild(b));
  tools.appendChild(more);tools.appendChild(fly);tools.appendChild(colp);
  const paintDot=()=>{const p=tools.querySelector('.sw[aria-pressed="true"]');dot.style.setProperty('--c',(p&&p.dataset.c)||'var(--fg)')};
  if(sw)new MutationObserver(paintDot).observe(sw,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','style']});
  paintDot();
  // recientes
  let mru;try{mru=JSON.parse(LS.get('xs49-rec')||'null')}catch(_){mru=null}
  if(!Array.isArray(mru))mru=['pen','text','stbtn'];
  mru=mru.filter(k=>byKey[k]).slice(0,3);
  ['pen','text','stbtn','eraser'].forEach(k=>{if(mru.length<3&&byKey[k]&&!mru.includes(k))mru.push(k)});
  const renderRec=()=>{rec.innerHTML='';mru.forEach(k=>{const o=byKey[k];if(!o||o.hidden)return;const p=document.createElement('button');p.className='trec';p.title=(o.title||LAB[k]||'');p.dataset.k=k;
    const s=o.querySelector('svg');p.innerHTML=s?s.outerHTML:'•';if(o.getAttribute('aria-pressed')!==null)p.setAttribute('aria-pressed',o.getAttribute('aria-pressed'));
    p.onclick=()=>{o.click()};rec.appendChild(p)})};
  renderRec();
  new MutationObserver(renderRec).observe(fly,{subtree:true,attributes:true,attributeFilter:['aria-pressed','hidden']});
  const closeAll=()=>{fly.classList.remove('on');colp.classList.remove('on');more.setAttribute('aria-pressed','false');dot.setAttribute('aria-pressed','false')};
  more.onclick=e=>{e.stopPropagation();const o=!fly.classList.contains('on');closeAll();if(o){fly.classList.add('on');more.setAttribute('aria-pressed','true')}};
  dot.onclick=e=>{e.stopPropagation();const o=!colp.classList.contains('on');closeAll();if(o){colp.classList.add('on');dot.setAttribute('aria-pressed','true')}};
  colp.addEventListener('click',e=>{if(e.target.closest('.sw'))setTimeout(closeAll,60)});
  fly.addEventListener('click',e=>{const b=e.target.closest('button.tb3');if(!b)return;const k=keyOf(b);
    mru=[k,...mru.filter(x=>x!==k)].slice(0,3);LS.set('xs49-rec',JSON.stringify(mru));renderRec();setTimeout(closeAll,0)});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#tools'))closeAll()},true);
  // ocultar toda la barra con un punto arriba
  const h=document.createElement('button');h.id='thide';h.setAttribute('aria-label','Mostrar u ocultar herramientas');h.title='Ocultar / mostrar herramientas';h.innerHTML='<i></i>';
  tools.prepend(h);
  const setOff=o=>{tools.classList.toggle('off',o);h.setAttribute('aria-pressed',o?'true':'false');LS.set('xs49-off',o?'1':'0')};
  setOff(LS.get('xs49-off')==='1');
  h.onclick=()=>{closeAll();setOff(!tools.classList.contains('off'))};
 }}

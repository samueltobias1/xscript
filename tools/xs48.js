/* ================= 4.8 · tarjetas nuevas con duración, Arcos sin actos empalmados, barra de objetos simple, herramientas a la izquierda ================= */

/* ---- A. tarjetas nuevas que miden 0 páginas: no se ven en el timeline ni en Arcos ---- */
function zeroAsk(){
  if(CHILD)return;
  setTimeout(()=>{
    if(!P||P.zeroAsk||(typeof curV!=='undefined'&&curV&&curV.locked)||document.querySelector('#xdlg'))return;
    try{if(cloud()&&!CL.canEdit)return}catch(_){}
    const zs2=P.scenes.filter(s=>s.nw&&s.on&&!s.pages);if(!zs2.length)return;
    xdlg({title:'Tus tarjetas nuevas miden 0 páginas',sm:true,
      html:`<p>${zs2.length} ${zs2.length===1?'tarjeta nueva no tiene':'tarjetas nuevas no tienen'} duración. Por eso no se ven en el timeline ni en Arcos, y el recuadro del timeline se queda atorado cuando solo hay tarjetas así a la vista.</p><p style="color:var(--mute);font-size:13px">¿Les pongo <b>1 página</b> a cada una? Después le cambias la duración a la que quieras, tarjeta por tarjeta.</p>`,
      buttons:[{label:'Ahora no',fn:()=>{P.zeroAsk=1;try{XSX.save&&XSX.save()}catch(_){}}},
        {label:'Sí, 1 página a cada una',pri:true,fn:()=>{
          const s0=snapState();P.scenes.filter(s=>s.nw&&s.on&&!s.pages).forEach(s=>{s.pages=P.defPg||8});P.zeroAsk=1;
          pushUndo(s0);try{buildCards();recountChars();refreshAll()}catch(e){console.error(e)}try{XSX.save&&XSX.save()}catch(_){}
          toast('Listo: las tarjetas nuevas ahora miden 1 página',3500)}}]})},2500)}
{const _a=activate;activate=function(v){_a(v);try{zeroAsk()}catch(_){}}}

/* ---- B. barra de objetos: simple por defecto, lo demás se abre con un clic ---- */
{const X=window.__xs42,gb=document.getElementById('gbar');let open=null;
 const sw=(id,cur,none)=>`<span class="obs" id="${id}">${none?`<button data-v="" style="--c:transparent;background:repeating-linear-gradient(45deg,#888 0 2px,transparent 2px 5px)" title="Sin color"${!cur?' aria-pressed="true"':''}></button>`:''}${X.COLS.map(c=>`<button data-v="${c}" style="--c:${c}" aria-label="${c}"${cur===c?' aria-pressed="true"':''}></button>`).join('')}</span>`;
 const pop=(name,label,body,extra)=>`<span class="gpw"><button class="btn gpb" data-pop="${name}" aria-pressed="${open===name}">${label} ▾</button>${open===name?`<div class="gpop">${body}</div>`:''}</span>`;
 function render(o){
  const st=o.k==='st',isNote=st&&o.st==='note',size=st?(o.s||32):(o.fs||20),hasBg=st&&!['plain','stamp'].includes(o.st||'plain');
  const sty=X.STY.find(x=>x[0]===(o.st||'plain'));
  const colorBody=`<div class="gl">Letra</div>${sw('gC',o.c)}${hasBg?`<div class="gl">Fondo</div>${sw('gB',o.bg)}`:''}`;
  const styleBody=`<div class="gl">Estilo</div><div class="gcol">${X.STY.map(([k,n])=>`<button data-st="${k}" aria-pressed="${(o.st||'plain')===k}">${n}</button>`).join('')}</div>`;
  const fontBody=`<div class="gl">Letra</div><div class="gcol">${Object.entries(X.FONTS).map(([k,[n,f]])=>`<button data-f="${k}" style="font-family:${f.replace(/"/g,"'")}" aria-pressed="${(o.f||'courier')===k}">${n}</button>`).join('')}</div>`;
  const moreBody=`<label class="gl2">Giro <input type="number" id="gRn" min="-180" max="180" value="${o.rot||0}"> °</label><button class="btn" data-g="front">Al frente</button><button class="btn" data-g="dup">Duplicar</button>`;
  gb.innerHTML=`<b>${st?'Sticker':'Texto'}</b>
   <label>Tamaño <input type="number" id="gSn" min="8" max="400" value="${size}"></label>
   ${isNote?`<label>Ancho <input type="number" id="gWn" min="60" max="900" value="${o.w||Math.max(200,Math.round((o.s||18)*11))}"></label>`:''}
   <button class="btn" data-g="b" aria-pressed="${!!o.b}" title="Negrita (Ctrl+B)"><b style="color:inherit;text-transform:none;font-size:13px">B</b></button><button class="btn" data-g="i" aria-pressed="${!!o.i}" title="Cursiva (Ctrl+I)"><i style="font-size:13px">I</i></button>
   ${pop('color','Color',colorBody)}
   ${st?pop('style','Estilo',styleBody):`<button class="btn" data-g="mk" title="Le pone fondo, giro y estilos">Hacer sticker</button>`}
   ${pop('font','Letra',fontBody)}
   ${st?pop('more','Más',moreBody):''}
   <button class="btn" data-g="del">Borrar</button>`};
 const _gbar=XSX.gbar;
 XSX.gbar=function(){_gbar();
   if(gb.hidden||!gb.querySelector('#gF'))return;
   const a=X.sel();if(a.length!==1){return}render(a[0])};
 gb.addEventListener('click',e=>{const b=e.target.closest('[data-pop]');if(!b)return;open=open===b.dataset.pop?null:b.dataset.pop;XSX.gbar()},true);
 document.addEventListener('pointerdown',e=>{if(open&&!e.target.closest('#gbar')){open=null;XSX.gbar()}},true);
 let nSnap=null;
 gb.addEventListener('input',e=>{const t=e.target;if(!/^g(Sn|Wn|Rn)$/.test(t.id))return;
   const a=X.sel();if(a.length!==1)return;const o=a[0],n=+t.value;if(!isFinite(n)||t.value==='')return;
   if(!nSnap)nSnap=snapState();
   if(t.id==='gSn'){const v=Math.max(8,Math.min(400,Math.round(n)));if(o.k==='st')o.s=v;else o.fs=v}
   else if(t.id==='gWn')o.w=Math.max(60,Math.min(900,Math.round(n)));
   else o.rot=Math.max(-180,Math.min(180,Math.round(n)));
   drawInk();saveSoon()});
 gb.addEventListener('change',e=>{if(nSnap){pushUndo(nSnap);nSnap=null}});
}

/* ---- C. las herramientas viven a la izquierda; abajo solo el zoom ---- */
{const tools=document.getElementById('tools');
 if(tools){
  const ICO={newbtn:'<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M20 8v6M17 11h6"/>',mkbtn:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',zbtn:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',linkbtn:'<path d="M5 19L19 5" stroke-dasharray="2 3"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/>',relayout:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'};
  const LAB={newbtn:'Tarjeta',mkbtn:'Marker',zbtn:'Zonas',linkbtn:'Líneas',relayout:'Acomodar'};
  tools.appendChild(document.createElement('hr'));
  ['newbtn','mkbtn','zbtn','linkbtn','relayout'].forEach(id=>{const b=document.getElementById(id);if(!b)return;
    b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICO[id]+'</svg><em>'+LAB[id]+'</em>';
    b.classList.add('tb2');tools.appendChild(b)})}}

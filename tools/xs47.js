/* ================= 4.7 · notas tipo post-it: ancho fijo, negritas y cursiva por palabra, derechas ================= */
const NOTE_W=200;
const noteW=tx=>tx.w||Math.max(NOTE_W,Math.round((tx.s||18)*11));
/* HTML permitido en una nota: solo <b>, <i> y saltos de línea. Todo lo demás se limpia. */
function noteSan(h){
  const doc=new DOMParser().parseFromString('<body>'+String(h||'')+'</body>','text/html');
  const walk=(n,top)=>{let o='';
    n.childNodes.forEach((c,i)=>{
      if(c.nodeType===3){o+=esc(c.nodeValue);return}
      if(c.nodeType!==1)return;
      const t=c.tagName;
      if(t==='BR'){o+='<br>';return}
      let inner=walk(c,false);
      const st=c.getAttribute&&c.getAttribute('style')||'';
      const bold=t==='B'||t==='STRONG'||/font-weight:\s*(bold|[6-9]00)/i.test(st),ital=t==='I'||t==='EM'||/font-style:\s*italic/i.test(st);
      if(bold)inner='<b>'+inner+'</b>';if(ital)inner='<i>'+inner+'</i>';
      if(t==='DIV'||t==='P'){o+=((o&&!/<br>$/.test(o))?'<br>':'')+(inner==='<br>'?'':inner)+(inner==='<br>'?'<br>':'');return}
      if(c.classList&&c.classList.contains('eh'))return;
      o+=inner});
    return o};
  return walk(doc.body,true).replace(/(<br>)+$/,'')}
const _stPaint=XSX.stPaint;
XSX.stPaint=(d,tx)=>{
  _stPaint(d,tx);
  if(tx.st!=='note')return;
  d.classList.add('nw');d.style.width=noteW(tx)+'px';d.style.minHeight=Math.round(noteW(tx)*.72)+'px';
  if(tx.h){d.innerHTML=noteSan(tx.h)+'<i class="eh"></i>'}};
/* al editar una nota, el texto con formato se guarda (como <b>/<i>) además del texto plano */
{const _et=editText;
 editText=function(id,isNew){
   _et(id,isNew);
   const v=V(),o=v.texts.find(x=>x.id===id),el=textsEl.querySelector(`[data-id="${id}"]`);
   if(!o||!el||!(o.k==='st'&&o.st==='note'))return;
   const ob=el.onblur,ok=el.onkeydown;
   el.onblur=function(ev){const c=el.cloneNode(true);const eh=c.querySelector('.eh');if(eh)eh.remove();
     const h=noteSan(c.innerHTML);o.h=/<[bi]>/.test(h)?h:undefined;if(o.h===undefined)delete o.h;
     return ob.call(this,ev)};
   el.onkeydown=function(ev){
     const mod=ev.ctrlKey||ev.metaKey,k=ev.key.toLowerCase();
     if(mod&&(k==='b'||k==='i')){ev.preventDefault();ev.stopPropagation();document.execCommand(k==='b'?'bold':'italic');return}
     return ok.call(this,ev)};
   el.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,(e.clipboardData.getData('text/plain')||''))})}}
/* los botones B e I de la barra: con una nota en edición, afectan a la selección */
XSX.fmt=a=>{const el=document.activeElement;
  if(el&&el.isContentEditable&&el.classList&&el.classList.contains('st-note')){document.execCommand(a==='b'?'bold':'italic');return true}return false};
{const gbEl=document.getElementById('gbar');if(gbEl)gbEl.addEventListener('mousedown',e=>{if(e.target.closest('[data-g="b"],[data-g="i"]'))e.preventDefault()},true)}
/* esquina de la nota: cambia el ANCHO (la letra no cambia) */
textsEl.addEventListener('pointerdown',e=>{
  const eh=e.target.closest&&e.target.closest('.tx.st-note .eh');if(!eh)return;
  const el=eh.closest('.tx'),o=V().texts.find(x=>x.id===el.dataset.id);if(!o)return;
  e.stopImmediatePropagation();e.stopPropagation();e.preventDefault();
  eh.setPointerCapture(e.pointerId);
  const w0=toWorld(e.clientX,e.clientY),W0=noteW(o),s0=snapState();let moved=false;
  const mv=ev=>{const w=toWorld(ev.clientX,ev.clientY);const nw=Math.max(80,Math.min(900,Math.round(W0+(w.x-w0.x))));
    if(nw!==o.w){o.w=nw;moved=true;el.style.width=nw+'px';el.style.minHeight=Math.round(nw*.72)+'px'}};
  const up=()=>{eh.removeEventListener('pointermove',mv);eh.removeEventListener('pointerup',up);eh.removeEventListener('pointercancel',up);
    if(moved){pushUndo(s0);drawInk();XSX.gbar&&XSX.gbar()}};
  eh.addEventListener('pointermove',mv);eh.addEventListener('pointerup',up);eh.addEventListener('pointercancel',up)},true);
/* todo lo que ya existía con giro se endereza una vez; lo que gires después se respeta */
{const _fp=finishProject;
 finishProject=function(p){const r=_fp(p);
   if(r&&!r.rot47){r.rot47=1;Object.values(r.views||{}).forEach(v=>(v.texts||[]).forEach(t=>{if(t.k==='st')t.rot=0}))}
   return r}}

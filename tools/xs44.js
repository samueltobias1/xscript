/* ================= XSCRIPT 4.4 · Save the Cat: una sola fila de segmentos por acto, con zonas que se pueden ocultar ================= */
{
const stcV4=()=>P.views.stc;
const hidOf=()=>stcV4().hid||{};
function bandCards(i){const v=stcV4(),E=v.edges;return P.scenes.filter(s=>{const p=v.pos[s.id];if(!p)return false;const c=p.x+cardW(s)/2;return c>=E[i]&&c<E[i+1]})}
function setHid(i,hide){
  const v=stcV4(),E=v.edges;if(!E||E.length!==STC.length+1)return;
  v.hid=v.hid||{};
  if(hide){
    if(v.hid[i])return;
    if(Object.keys(v.hid).length>=STC.length-1){toast('Deja al menos una zona visible');return}
    const inner=bandCards(i),run=()=>{
      const s0=snapState(),w=E[i+1]-E[i],g=grabAfter(E[i+1]);
      inner.forEach(s=>{const p=v.pos[s.id];p.x=i>0?E[i]-12-cardW(s)/2:E[i]+12-cardW(s)/2});
      applyShift(g,-w);for(let j=i+1;j<E.length;j++)E[j]-=w;
      v.hid[i]=Math.max(1,Math.round(w));
      pushUndo(s0);placeCards();paintBeats();drawBg();drawInk();applyFilters&&applyFilters();zRefresh();
      toast('«'+bandName('stc',i)+'» oculta; lo demás se recorrió. Vuelve a mostrarla en «Zonas».',3600)};
    if(inner.length)askSure('«'+bandName('stc',i)+'» tiene '+inner.length+(inner.length===1?' tarjeta':' tarjetas')+'. Se pasan al borde de la zona de al lado.','Ocultar',run);else run();
  }else{
    if(!v.hid[i])return;
    const s0=snapState(),w=v.hid[i],g=grabAfter(E[i]);
    applyShift(g,w);for(let j=i+1;j<E.length;j++)E[j]+=w;
    delete v.hid[i];pushUndo(s0);placeCards();paintBeats();drawBg();drawInk();zRefresh()}
}
/* ---- ventana «Zonas» ---- */
const zp=document.createElement('div');zp.id='zpop';zp.hidden=true;board.appendChild(zp);
function zRefresh(){
  if(zp.hidden)return;const h=hidOf();let act='',html='<h4>Zonas del Save the Cat</h4><p>Quita las que no vayas a usar: el resto se recorre.</p>';
  STC.forEach((d,i)=>{if(d[4]!==act){act=d[4];html+='<div class="zact" style="--c:'+bandCol(d[3])+'">'+esc(act)+'</div>'}
    html+='<label class="zrow"><input type="checkbox" data-z="'+i+'"'+(h[i]?'':' checked')+'><span>'+esc(bandName('stc',i))+'</span><small>'+(d[5]==='m'?'momento':'zona')+'</small></label>'});
  html+='<button class="btn" data-zall>Mostrar todas</button>';zp.innerHTML=html}
zp.addEventListener('pointerdown',e=>e.stopPropagation());
zp.addEventListener('change',e=>{const c=e.target.closest('[data-z]');if(!c)return;const i=+c.dataset.z;if(c.checked)setHid(i,false);else{c.checked=true;setHid(i,true)};setTimeout(zRefresh,50)});
zp.addEventListener('click',e=>{if(e.target.closest('[data-zall]')){const h=hidOf();Object.keys(h).map(Number).sort((a,b)=>a-b).forEach(i=>setHid(i,false));zRefresh()}});
{const z=$('#zoomui'),b=document.createElement('button');b.id='zbtn';b.dataset.a='zones';b.title='Elegir qué zonas del Save the Cat usar';b.textContent='Zonas';
 z.insertBefore(b,$('#mkbtn').nextSibling);b.hidden=view!=='stc';
 b.addEventListener('click',()=>{zp.hidden=!zp.hidden;if(!zp.hidden){zRefresh()}});
 document.addEventListener('pointerdown',e=>{if(!zp.hidden&&!e.target.closest('#zpop,#zbtn,#sure'))zp.hidden=true},true)}
XSX.setHid=setHid;
}

/* ================= 5.0 · el timeline sigue la POSICIÓN de las tarjetas en el pizarrón (no las páginas) ================= */
function tkExt(){
  if(!P||!P.views||!V())return null;const v=V();let lo=1e18,hi=-1e18,n=0;
  P.scenes.forEach(s=>{if(!s.on)return;const p=v.pos[s.id];if(!p)return;lo=Math.min(lo,p.x);hi=Math.max(hi,p.x+cardW(s));n++});
  if(!n)return null;return{lo,span:Math.max(hi-lo,1)}}
function tkR(s){const E=tkExt(),p=E&&V().pos[s.id];if(!p)return null;
  return{a:(p.x-E.lo)/E.span*100,b:(p.x+cardW(s)-E.lo)/E.span*100}}
drawTrack=function(){
  setTimeout(()=>{try{XSX.trk&&XSX.trk()}catch(_){}},0);drawPay();drawTrackHitos();
  const tr=$('#trseg');if(!tr||!P)return;const on=filtOn();
  tr.innerHTML=P.scenes.filter(s=>s.on).map(s=>{const r=tkR(s);if(!r)return'';const b=beatOf(s),m=!on||matches(s);
    return`<div class="sg${m?' on':''}${selC.has(s.id)?' sel':''}" data-id="${s.id}" title="${esc('Esc. '+s.num+' · '+(s.title||s.head)+' · '+b.n)}" style="left:${r.a.toFixed(3)}%;width:${Math.max(r.b-r.a,.25).toFixed(3)}%;--c:${b.c}"></div>`}).join('')};
drawTrackHitos=function(){
  const el=$('#trht');if(!el||!P)return;
  el.innerHTML=(P.hitos||[]).map(h=>{const s=byId(h.s);const r=s&&s.on&&tkR(s);if(!r)return'';const a=arcOf(h);
    return`<i class="th" style="left:${((r.a+r.b)/2).toFixed(2)}%;--c:${a?a.c:'var(--faint)'}"></i>`}).join('')};
updateRwin=function(){
  const w=$('#rwin');if(!w)return;if(!P||view==='arcs'){w.hidden=true;return}
  const E=tkExt();if(!E){w.hidden=true;return}
  const t=T(),x0=-t.x/t.z,x1=(board.clientWidth-t.x)/t.z;
  let a=(x0-E.lo)/E.span*100,b=(x1-E.lo)/E.span*100;
  const wd=Math.max(Math.min(b-a,100),.8);a=Math.max(0,Math.min(a,100-wd));
  w.hidden=false;w.style.left=a+'%';w.style.width=wd+'%'};
scrubTo=function(p){
  const E=tkExt();if(!E)return;const cx=E.lo+Math.max(0,Math.min(100,p))/100*E.span;
  const t=T();t.x=board.clientWidth/2-cx*t.z;applyT()};

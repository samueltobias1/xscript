/* ================= 5.5 · Dashboard de producción (en Breakdown) ================= */
(function(){
  let ON=false;try{ON=localStorage.getItem('xs55-dash')==='1'}catch(_){}
  const F={tod:null,ie:null,loc:null,ch:null,dept:null,el:null};
  const OPEN={chars:false,locs:false,dept:{}};
  const TOD={D:['Día','#e3bd3f'],N:['Noche','#5b6ee1'],T:['Atardecer / amanecer','#e8893c'],X:['Sin hora','#7d848e']};
  const IEC={INT:['INT','#3fae9d'],EXT:['EXT','#a27be3'],IE:['INT/EXT','#cf7fa4'],X:['Sin INT/EXT','#7d848e']};
  const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const f8=n=>{n=Math.max(0,Math.round(n||0));if(!n)return'0';const w=Math.floor(n/8),r=n%8;return(w?w+(r?' ':''):'')+(r?r+'/8':'')};
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const money=n=>{try{return '$'+Math.round(n).toLocaleString('es-MX')}catch(_){return '$'+Math.round(n)}};

  /* ---- leer el encabezado: INT/EXT, locación, hora ---- */
  function parseHead(h){
    let t=String(h||'').replace(/^\s*\d+[A-Z]?\s*[.)-]?\s+(?=(INT|EXT|I\/E))/i,'').trim();
    let ie='X';const m=t.match(/^(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\/E|INTERIOR|EXTERIOR|INT|EXT)\b\.?\s*/i);
    if(m){const k=norm(m[1]).replace(/\.|\s/g,'');ie=k.includes('/')||k==='IE'?'IE':(k.startsWith('INT')?'INT':'EXT');t=t.slice(m[0].length)}
    if(ie==='X'&&/^ESCENA NUEVA$/.test(norm(t)))return{ie,tod:'X',loc:'',sub:''};
    const segs=t.split(/\s*-\s+|\s+-\s*|\s*[–—]\s*|\.\s+|\.$/).map(x=>x.trim()).filter(Boolean);
    let tod='X',ti=-1;
    for(let i=segs.length-1;i>=0&&i>=segs.length-2;i--){const s=norm(segs[i]);let k=null;
      if(/CONTINU|MISMO MOMENTO|SAME|MOMENTOS (DESPUES|ANTES)|MAS TARDE|LATER|SIMULT|SEGUNDOS/.test(s))k='C';
      else if(/ATARDECER|AMANECER|ANOCHECER|CREPUSCULO|DUSK|DAWN|SUNSET|SUNRISE|MAGIC|OCASO|ALBA/.test(s))k='T';
      else if(/NOCHE|NIGHT|MADRUGADA/.test(s))k='N';
      else if(/\bDIA\b|\bDAY\b|MANANA|MORNING|TARDE|AFTERNOON|MEDIODIA|NOON/.test(s))k='D';
      if(k){tod=k;ti=i;break}}
    const ls=ti>=0?segs.slice(0,ti):segs;
    return{ie,tod,loc:(ls[0]||'').trim(),sub:ls.slice(1).join(' · ')}}

  /* ---- juntar los datos ---- */
  function data(){
    const v=curV,Pp=v&&v.P;if(!Pp)return null;
    let sc=Pp.scenes.filter(s=>s.on!==false);
    if(sc.some(s=>!s.nw))sc=sc.filter(s=>!s.nw);
    let prev='X',pos=0;
    const S=sc.map((s,i)=>{const h=parseHead(s.head||'');let tod=h.tod;if(tod==='C')tod=prev==='X'?'X':prev;if(tod!=='X')prev=tod;
      const len=Math.max(1,Math.round(s.pages==null?8:s.pages));const o={s,i,num:s.num||String(i+1),ie:h.ie,tod,loc:h.loc,lk:norm(h.loc)||'—',sub:h.sub,len,x0:pos,chars:(s.chars||[]).filter(Boolean),els:[]};pos+=len;return o});
    const total=pos;
    /* nombre más común por locación */
    const names={};S.forEach(o=>{const n=names[o.lk]=names[o.lk]||{};const k=o.loc||'Sin locación';n[k]=(n[k]||0)+1});
    S.forEach(o=>{const n=names[o.lk];o.locName=Object.keys(n).sort((a,b)=>n[b]-n[a])[0]});
    /* elementos de breakdown (vienen de Revisión/Breakdown) */
    const st=v.stats,els=(st&&st.els)||null;
    if(els){if(!v.smap)try{mapStats(v)}catch(_){}
      const byIdx={};Object.entries(v.smap||{}).forEach(([id,i])=>{byIdx[i]=id});
      const byId={};S.forEach(o=>{byId[o.s.id]=o});
      els.forEach(e=>{const o=byId[byIdx[e.s]];const d=e.d||'Sin depto',nm=(e.e||'').trim()||'(sin nombre)';
        const it={d,e:nm,ek:d+'|'+norm(nm),c:e.c||0,k:e.k};if(o)o.els.push(it);else(S.orph=S.orph||[]).push(it)})}
    return{S,total,hasEls:!!els,cur:(st&&st.cfg&&st.cfg.cur)||'MXN'}}

  const pass=(o,skip)=>(skip==='tod'||!F.tod||o.tod===F.tod)&&(skip==='ie'||!F.ie||o.ie===F.ie)&&(skip==='loc'||!F.loc||o.lk===F.loc)
    &&(skip==='ch'||!F.ch||o.chars.some(c=>norm(c)===F.ch))&&(skip==='dept'||!F.dept||o.els.some(e=>e.d===F.dept))&&(skip==='el'||!F.el||o.els.some(e=>e.ek===F.el));

  /* tira del guion: dónde aparece algo, de principio a fin */
  function strip(D,test){
    let r='';D.S.forEach(o=>{if(!test(o))return;const x=o.x0/D.total*100,w=Math.max(.35,o.len/D.total*100);r+=`<i style="left:${x.toFixed(2)}%;width:${w.toFixed(2)}%"></i>`});
    return`<span class="dstrip">${r}</span>`}
  const sum=(arr,f)=>arr.reduce((a,o)=>a+f(o),0);

  function stacked(D,L,key,map,fk){
    const tot=sum(L,o=>o.len)||1,cnt={};L.forEach(o=>{const c=cnt[o[key]]=cnt[o[key]]||{n:0,p:0};c.n++;c.p+=o.len});
    const ks=Object.keys(map).filter(k=>cnt[k]);
    const bar=ks.map(k=>`<i data-f="${fk}" data-v="${k}" title="${map[k][0]}: ${pct(cnt[k].p,tot)}%" style="width:${cnt[k].p/tot*100}%;background:${map[k][1]}"${F[fk]&&F[fk]!==k?' class="dim"':''}></i>`).join('');
    const leg=ks.map(k=>`<button class="dleg${F[fk]===k?' on':''}" data-f="${fk}" data-v="${k}"><span style="background:${map[k][1]}"></span><b>${map[k][0]}</b><em>${pct(cnt[k].p,tot)}%</em><small>${cnt[k].n} esc · ${f8(cnt[k].p)} pp</small></button>`).join('');
    return`<div class="dsbar">${bar||'<i style="width:100%;background:var(--line)"></i>'}</div><div class="dlegs">${leg}</div>`}

  function render(){
    const el=$('#xdash');if(!el||el.hidden)return;
    const D=data();
    if(!D||!D.S.length){el.innerHTML='<div class="dwrap"><div class="dempty">Este proyecto aún no tiene escenas. Crea tarjetas o sube el PDF del guion y aquí aparece el dashboard.</div></div>';return}
    const L=D.S.filter(o=>pass(o)),pages=sum(L,o=>o.len);
    const locs={},chars={},depts={};
    L.forEach(o=>{const l=locs[o.lk]=locs[o.lk]||{k:o.lk,name:o.locName,n:0,p:0,night:0,vfx:0,els:0};l.n++;l.p+=o.len;if(o.tod==='N')l.night++;
      o.els.forEach(e=>{if(F.dept&&e.d!==F.dept)return;if(F.el&&e.ek!==F.el)return;l.els++;if(/vfx/i.test(e.d))l.vfx++});
      const seen=new Set();o.chars.forEach(c=>{const k=norm(c);if(seen.has(k))return;seen.add(k);const x=chars[k]=chars[k]||{k,name:c,n:0,p:0};x.n++;x.p+=o.len});
      o.els.forEach(e=>{const d=depts[e.d]=depts[e.d]||{d:e.d,marks:0,cost:0,sc:new Set(),items:{}};d.marks++;d.cost+=e.c;d.sc.add(o.i);
        const it=d.items[e.ek]=d.items[e.ek]||{ek:e.ek,name:e.e,marks:0,cost:0,sc:new Set(),p:0,lk:0};it.marks++;it.cost+=e.c;if(e.k==='lk')it.lk++;if(!it.sc.has(o.i)){it.sc.add(o.i);it.p+=o.len}})});
    const vx={};L.forEach(o=>o.els.forEach(e=>{if(!/vfx/i.test(e.d))return;if(F.el&&e.ek!==F.el)return;const x=vx[o.lk]=vx[o.lk]||{k:o.lk,name:o.locName,n:0,sc:new Set(),it:new Set()};x.n++;x.sc.add(o.i);x.it.add(e.e)}));
    const VX=Object.values(vx).sort((a,b)=>b.n-a.n),mxV=Math.max(1,...VX.map(x=>x.n));
    const LL=Object.values(locs).sort((a,b)=>b.p-a.p||b.n-a.n),CC=Object.values(chars).sort((a,b)=>b.n-a.n||b.p-a.p),DD=Object.values(depts).sort((a,b)=>b.marks-a.marks);
    const nEls=DD.reduce((a,d)=>a+Object.keys(d.items).length,0),cost=DD.reduce((a,d)=>a+d.cost,0);
    const mxL=Math.max(1,...LL.map(l=>l.p)),mxC=Math.max(1,...CC.map(c=>c.n));
    const fl=[];
    if(F.tod)fl.push(['tod',TOD[F.tod][0]]);if(F.ie)fl.push(['ie',IEC[F.ie][0]]);
    if(F.loc)fl.push(['loc',(D.S.find(o=>o.lk===F.loc)||{}).locName||F.loc]);if(F.ch)fl.push(['ch',(CC.find(c=>c.k===F.ch)||{name:F.ch}).name]);
    if(F.dept)fl.push(['dept',F.dept]);if(F.el){let nm=F.el;D.S.some(o=>o.els.some(e=>{if(e.ek===F.el){nm=e.e;return true}}));fl.push(['el',nm])}
    const kpi=(n,l,s)=>`<div class="dk"><b>${n}</b><span>${l}</span>${s?`<small>${s}</small>`:''}</div>`;
    const locRow=l=>`<div class="drow${F.loc===l.k?' on':''}" data-f="loc" data-v="${esc(l.k)}"><div class="dn"><b>${esc(l.name)}</b><small>${l.n} esc · ${f8(l.p)} pp${l.night?` · <span class="dnight">${l.night} noche</span>`:''}${l.vfx?` · <span class="dvfx">${l.vfx} VFX</span>`:''}</small></div><span class="dbar"><i style="width:${l.p/mxL*100}%"></i></span>${strip(D,o=>o.lk===l.k&&pass(o,'loc'))}</div>`;
    const chRow=c=>`<div class="drow${F.ch===c.k?' on':''}" data-f="ch" data-v="${esc(c.k)}"><div class="dn"><b>${esc(c.name)}</b><small>${c.n} esc · ${f8(c.p)} pp</small></div><span class="dbar ch"><i style="width:${c.n/mxC*100}%"></i></span>${strip(D,o=>o.chars.some(x=>norm(x)===c.k)&&pass(o,'ch'))}</div>`;
    const chList=OPEN.chars?CC:CC.slice(0,12);
    const deptCard=d=>{const items=Object.values(d.items).sort((a,b)=>b.sc.size-a.sc.size||b.marks-a.marks);const op=OPEN.dept[d.d]||F.dept===d.d||items.length<=6;
      return`<div class="ddept${F.dept===d.d?' on':''}"><div class="ddh" data-f="dept" data-v="${esc(d.d)}"><b>${esc(d.d)}</b><span>${items.length} elemento${items.length===1?'':'s'} · ${d.sc.size} esc${d.cost?' · '+money(d.cost):''}</span></div>
        ${(op?items:items.slice(0,6)).map(it=>`<div class="drow sm${F.el===it.ek?' on':''}" data-f="el" data-v="${esc(it.ek)}"><div class="dn"><b>${esc(it.name)}</b><small>sale en <em>${it.sc.size} escena${it.sc.size===1?'':'s'}</em> · ${f8(it.p)} pp${it.cost?' · '+money(it.cost):''}${it.lk?` · <span class="dlk">${it.lk} lock</span>`:''}</small></div>${strip(D,o=>o.els.some(e=>e.ek===it.ek)&&pass(o,'el'))}</div>`).join('')}
        ${!op&&items.length>6?`<button class="dmore" data-open="${esc(d.d)}">Ver los ${items.length}</button>`:''}</div>`};
    el.innerHTML=`<div class="dwrap">
      <div class="dtop"><h2>Dashboard · ${esc(curV.label||'')}</h2><span class="dsp"></span>${fl.length?`<div class="dfl">${fl.map(([k,t])=>`<button data-x="${k}">${esc(t)} ✕</button>`).join('')}<button class="dclr" data-x="all">Quitar filtros</button></div>`:'<small class="dhint">Pica cualquier cosa para filtrar todo el dashboard</small>'}</div>
      <div class="dkpis">${kpi(L.length,'escenas',fl.length?'de '+D.S.length:'')}${kpi(f8(pages),'páginas',fl.length?pct(pages,D.total)+'% del guion':'')}${kpi(LL.length,'locaciones')}${kpi(CC.length,'personajes')}${D.hasEls?kpi(nEls,'elementos',DD.length+' deptos'):''}${cost?kpi(money(cost),'costo · '+D.cur):''}</div>
      <div class="dgrid2"><div class="dcard"><h3>Día / noche <small>por páginas</small></h3>${stacked(D,D.S.filter(o=>pass(o,'tod')),'tod',TOD,'tod')}</div>
        <div class="dcard"><h3>Interior / exterior <small>por páginas</small></h3>${stacked(D,D.S.filter(o=>pass(o,'ie')),'ie',IEC,'ie')}</div></div>
      <div class="dcard"><h3>Locaciones <small>${LL.length} · de más a menos páginas</small><span class="dsh">principio ··· final del guion</span></h3>${(OPEN.locs?LL:LL.slice(0,12)).map(locRow).join('')||'<div class="dempty">Nada con estos filtros.</div>'}${LL.length>12?`<button class="dmore" data-open="locs">${OPEN.locs?'Ver menos':'Ver las '+LL.length}</button>`:''}</div>
      <div class="dcard"><h3>Personajes <small>en cuántas escenas salen (por diálogo)</small><span class="dsh">principio ··· final del guion</span></h3>${chList.map(chRow).join('')||'<div class="dempty">No encontré personajes con diálogo.</div>'}${CC.length>12?`<button class="dmore" data-open="chars">${OPEN.chars?'Ver menos':'Ver los '+CC.length}</button>`:''}</div>
      ${VX.length?`<div class="dcard"><h3>VFX por locación <small>${VX.reduce((a,x)=>a+x.n,0)} VFX en ${VX.length} locaci${VX.length===1?'ón':'ones'}</small></h3>${VX.map(x=>`<div class="drow vx${F.loc===x.k?' on':''}" data-f="loc" data-v="${esc(x.k)}"><div class="dn"><b>${esc(x.name)}</b><small><span class="dvfx">${x.n} VFX</span> · ${x.sc.size} esc · ${esc([...x.it].slice(0,4).join(', '))}${x.it.size>4?'…':''}</small></div><span class="dbar vx"><i style="width:${x.n/mxV*100}%"></i></span></div>`).join('')}</div>`:''}
      <div class="dcard"><h3>Breakdown por departamento <small>props, vehículos, VFX… lo que marcaste en Breakdown</small></h3>
        ${!D.hasEls?'<div class="dempty">Abre esta versión en Breakdown con su PDF para leer los elementos marcados.</div>':DD.length?`<div class="ddepts">${DD.map(deptCard).join('')}</div>`:'<div class="dempty">Aún no hay elementos marcados'+(fl.length?' con estos filtros':'')+'. Marca props, vehículos o VFX en el guion (modo Breakdown) y aparecen aquí con en cuántas escenas salen.</div>'}</div>
    </div>`}

  /* ---- clicks: filtrar ---- */
  function onClick(e){
    const x=e.target.closest('[data-x]');if(x){if(x.dataset.x==='all')Object.keys(F).forEach(k=>F[k]=null);else F[x.dataset.x]=null;render();return}
    const m=e.target.closest('[data-open]');if(m){const k=m.dataset.open;if(k==='chars')OPEN.chars=!OPEN.chars;else if(k==='locs')OPEN.locs=!OPEN.locs;else OPEN.dept[k]=true;render();return}
    const f=e.target.closest('[data-f]');if(f){const k=f.dataset.f,v=f.dataset.v;F[k]=F[k]===v?null:v;render()}}

  /* ---- abrir/cerrar ---- */
  let key='';
  async function sync(){
    const show=ON&&mode==='bd'&&!!curV;
    const b=$('#dbtog');if(b){b.hidden=mode!=='bd';b.setAttribute('aria-pressed',ON)}
    const el=$('#xdash');if(!el)return;
    if(!show){el.hidden=true;return}
    const was=el.hidden;el.hidden=false;
    if(was){try{await refreshStats()}catch(_){} }
    key=curV.id+'|'+((curV.stats&&curV.stats.at)||0)+'|'+(curV.P?curV.P.scenes.length:0);
    render()}
  function toggle(){ON=!ON;try{localStorage.setItem('xs55-dash',ON?'1':'0')}catch(_){}if(ON){Object.keys(F).forEach(k=>F[k]=null)}sync()}
  function init(){
    if(!$('#xdash')){const d=document.createElement('div');d.id='xdash';d.hidden=true;$('#shwrap').appendChild(d);d.addEventListener('click',onClick)}
    if(!$('#dbtog')){const b=document.createElement('button');b.id='dbtog';b.hidden=true;b.title='Dashboard de producción: escenas, locaciones, día/noche, personajes y elementos';
      b.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>Dashboard';
      const vt=$('#vtabs');vt.parentNode.insertBefore(b,vt.nextSibling);b.onclick=toggle}
    /* refresca solo si cambió algo (otra versión, otras marcas, otras tarjetas) */
    setInterval(()=>{const el=$('#xdash');if(!el||el.hidden||!curV)return;const k=curV.id+'|'+((curV.stats&&curV.stats.at)||0)+'|'+(curV.P?curV.P.scenes.length:0);if(k!==key){key=k;render()}},1500);
    /* las marcas nuevas de Breakdown entran al volver al dashboard */
    setInterval(()=>{const el=$('#xdash');if(el&&!el.hidden&&curV&&curV.statsStale)refreshStats().then(render).catch(()=>{})},4000)}
  {const _sm55=showMode;showMode=async function(m){await _sm55(m);try{init();sync()}catch(e){console.warn('dash',e)}};XSX.setMode=showMode}
  XSX.dashToggle=toggle;
  window.__xd=()=>{const D=data();return D&&{n:D.S.length,total:D.total,hasEls:D.hasEls,heads:D.S.slice(0,6).map(o=>[o.ie,o.tod,o.locName,o.len,o.els.length])}};
  window.__xdp=parseHead;
})();

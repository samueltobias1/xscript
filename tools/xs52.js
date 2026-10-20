/* ================= 5.2 · guardado por partes (sin turnos): varias personas a la vez ================= */
/* El navegador sabe cómo estaba el proyecto en el servidor (CL.base). Al guardar compara, manda SOLO lo que cambió
   y el servidor lo junta con lo de los demás. Lo que otros cambian llega como "tandas" (CL.q) y se aplica a CL.base
   y a lo que ves. No hay turno: cualquiera con permiso de edición edita. */
CL.base=null;CL.q=[];CL.needReload=false;CL.resync=false;
let ptrDown=false,kickT=0;
addEventListener('pointerdown',()=>{ptrDown=true},true);
['pointerup','pointercancel','dragend'].forEach(t=>addEventListener(t,()=>{ptrDown=false},true));
addEventListener('blur',()=>{ptrDown=false});
const boardEditing=()=>{const a=document.activeElement;return !!(a&&a.isContentEditable&&a.closest&&a.closest('#board'))};
function enqueueB(list){
  for(const b of list||[]){
    if(!b||!Array.isArray(b.ops)||b.rev<=CL.rev||CL.q.some(x=>x.rev===b.rev))continue;
    CL.q.push(b)}
  CL.q.sort((x,y)=>x.rev-y.rev)}
function kick(){clearTimeout(kickT);kickT=setTimeout(async()=>{if(!(await drainQ()))kick()},300)}

/* ---- aplicar a lo que se ve ---- */
function liveApply(op,acc){
  const p=op.p;
  try{
    if(p[0]==='project'&&p[1]==='versions'){
      if(p.length<=3){acc.struct=true;return}
      const v=XP.vers.find(x=>x.id===p[2].slice(1));
      if(!v){acc.resync=true;return}
      const f=p[3],rest=Object.assign({},op,{p:p.slice(4)});
      if(f==='P'){if(p.length===4){acc.resync=true;return}XO.apply(v.P,rest);acc.touched.add(v)}
      else if(f==='meta'){if(p.length===4){if('v' in op)Object.assign(v,XO.clone(op.v));else acc.resync=true}else XO.apply(v,rest);acc.meta=true}
      else if(f==='rev'||f==='stats'||f==='pdf'){
        if(p.length===4){v[f]='v' in op?XO.clone(op.v):null}else XO.apply(v[f],rest);
        if(f==='rev')acc.rev.add(v);if(f==='stats')v.smap=null}
      else acc.resync=true}
    else if(p[0]==='project'&&p[1]==='meta'&&p.length>2){XO.apply(XP,Object.assign({},op,{p:p.slice(2)}));acc.meta=true}
  }catch(e){acc.resync=true}}
function afterLive(acc){
  if(acc.struct||acc.resync){CL.needReload=true;return}
  quiet++;
  try{
    if(acc.touched.has(curV)){
      P.scenes.forEach(s=>{s._hay=null});
      U.u.length=0;U.r.length=0;
      buildCards();recountChars();refreshAll(false)}
    if(acc.rev.has(curV)&&mode!=='piz'){reloadRev()}
    if(acc.meta){buildVTabs();updBar()}
    if([...acc.touched].some(v=>v!==curV)&&$('#cmpw')){try{cmpSplit()}catch(_){}}
    try{drawTrack()}catch(_){}
    paintFile()
  }catch(e){console.error('no pude refrescar los cambios de otros',e);CL.needReload=true}
  finally{setTimeout(()=>{quiet--},400)}}
function absorbOne(b,acc){
  const mine=b.device===DEV;
  for(const op of b.ops){
    try{XO.apply(CL.base,op)}catch(e){CL.resync=true;CL.needReload=true}
    if(!mine)liveApply(op,acc)}
  CL.rev=b.rev}
async function drainQ(force){
  CL.q=CL.q.filter(b=>b.rev>CL.rev);
  if(!CL.q.length){clearTimeout(CL.gapT);CL.gapT=0;return true}
  if(!force&&(ptrDown||boardEditing()))return false;
  const acc={touched:new Set(),rev:new Set(),meta:false,struct:false,resync:false};
  let n=0;
  while(CL.q.length&&CL.q[0].rev===CL.rev+1){absorbOne(CL.q.shift(),acc);n++}
  if(n)afterLive(acc);
  if(CL.q.length){
    // falta una tanda intermedia: se pide al servidor; si no llega, se recarga todo
    if(!CL.gapT)CL.gapT=setTimeout(()=>{CL.gapT=0;if(CL.q.length&&CL.q[0].rev>CL.rev+1){CL.needReload=true;maybeReload()}},6000);
    pollOps()}
  else{clearTimeout(CL.gapT);CL.gapT=0}
  await maybeReload();
  return true}
async function maybeReload(){
  if(!CL.needReload||CL.saving||CL.dirty||!CL.pid)return;
  CL.needReload=false;CL.q=[];
  try{await reloadCloud(true)}catch(e){CL.needReload=true}}

/* ---- preguntar por cambios de otros (respaldo del tiempo real) ---- */
async function pollOps(){
  if(!CL.pid||CL.polling||CL.saving||!cloud())return;
  CL.polling=true;
  try{
    const r=await fetch(`/api/projects/${CL.pid}/ops?since=${CL.rev}`,{credentials:'same-origin',cache:'no-store'});
    if(!r.ok){CL.offline=r.status>=500;paintFile();return}
    CL.offline=false;
    const j=await r.json();
    if(j.name&&XP&&j.name!==XP.name){XP.name=j.name;try{updBar()}catch(_){}paintFile()}
    if(j.reload)CL.needReload=true;else enqueueB(j.batches)
  }catch(_){CL.offline=true;paintFile()}
  finally{CL.polling=false}
  if(CL.q.length&&!(await drainQ()))kick();else await maybeReload()}

/* ---- tiempo real: el servidor avisa al instante de cada cambio ---- */
let wsO=null,wsT=0,wsPing=0,wsTry=0,wsFor=null;
function wsClose(){clearTimeout(wsT);clearInterval(wsPing);wsFor=null;if(wsO){try{wsO.onclose=null;wsO.close()}catch(_){}wsO=null}CL.live=false;CL.online=[];paintPres()}
function wsOpen(){
  if(CHILD||!CL.pid||!('WebSocket' in window))return;
  const pid=CL.pid;if(wsO&&wsFor===pid)return;wsClose();wsFor=pid;
  let ws;try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+`/api/projects/${pid}/ws?device=${encodeURIComponent(DEV)}`)}catch(_){return}
  wsO=ws;
  ws.onopen=()=>{wsTry=0;CL.live=true;clearInterval(wsPing);wsPing=setInterval(()=>{try{ws.send('ping')}catch(_){}},25000);
    startSync();pollOps()};
  ws.onmessage=ev=>{
    let m;try{m=JSON.parse(ev.data)}catch(_){return}
    if(m.type==='ops'&&m.batch){enqueueB([m.batch]);drainQ().then(ok=>{if(!ok)kick()})}
    else if(m.type==='reload'){CL.needReload=true;maybeReload()}
    else if(m.type==='presence'){CL.online=m.online||[];paintPres()}
    else if(m.type==='hello'){CL.online=m.online||[];paintPres();if(m.rev>CL.rev+CL.q.length)pollOps()}};
  ws.onclose=()=>{CL.live=false;CL.online=[];paintPres();clearInterval(wsPing);if(wsO===ws)wsO=null;wsFor=null;
    startSync();
    if(CL.pid===pid){wsTry++;clearTimeout(wsT);wsT=setTimeout(wsOpen,Math.min(30000,1000*2**Math.min(wsTry,5)))}};
  ws.onerror=()=>{}}
function paintPres(){
  let el=document.getElementById('xsPres');
  if(!el){const f=document.getElementById('xbFile');if(!f||!f.parentElement)return;el=document.createElement('span');el.id='xsPres';f.parentElement.insertBefore(el,f)}
  const others=(CL.online||[]).filter(x=>x.device!==DEV);
  if(!CL.pid||!others.length){el.hidden=true;el.textContent='';return}
  const names=[...new Set(others.map(x=>(x.name||'').split(' ')[0]||'Alguien'))];
  el.hidden=false;el.textContent='● '+(names.length>2?names.slice(0,2).join(', ')+' +'+(names.length-2):names.join(', '));
  el.title='También tienen abierto este proyecto: '+others.map(x=>x.name||x.email).join(', ')}
function startSync(){clearInterval(hbT);clearInterval(pollT);if(CHILD)return;pollT=setInterval(pollOps,CL.live?20000:4000)}
startTurn=startSync;startWatch=startSync;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&cloud()&&CL.pid){pollOps();if(!CL.live)wsOpen()}});
addEventListener('online',()=>{if(cloud()&&CL.pid){wsOpen();pollOps()}});
{const _gh=XSX.goHome;XSX.goHome=async function(){wsClose();return _gh.apply(this,arguments)}}

/* ---- guardar: solo lo que cambió ---- */
cloudSave=async function(now){
  if(!CL.pid||!CL.canEdit||!CL.base)return;
  if(CL.saving){CL.again=true;return}
  if(!CL.dirty&&!now&&!CL.q.length)return;
  if(CL.q.length&&!(await drainQ())){clearTimeout(saveT6);saveT6=setTimeout(()=>cloudSave(now),350);return}
  CL.saving=true;paintFile();const gen0=CL.gen||0;
  try{
    await uploadPdfs();
    const cur=XO.norm(JSON.parse(await bundleCloud()));
    const ops=XO.diff(CL.base,cur);
    if(ops.length){
      const {body,gz:g}=await gz(JSON.stringify({ops}));
      const r=await API(`/api/projects/${CL.pid}/ops?rev=${CL.rev}&device=${DEV}`,{method:'POST',body,headers:g?{'x-gz':'1'}:{}});
      if(r.status===403){CL.saving=false;CL.canEdit=false;CL.role='view';paintFile();toast('Ahora solo tienes permiso de lectura: lo que cambies ya no se guarda',6000);return}
      if(!r.ok)throw new Error(await errMsg(r));
      const j=await r.json();
      if(j.reload)CL.needReload=true;
      else{enqueueB(j.since);if(j.batch)enqueueB([j.batch])}
      CL.saving=false;
      if(CL.q.length)await drainQ(true)}
    CL.dirty=(CL.gen||0)!==gen0;CL.err=null;CL.offline=false;CL.savedAt=Date.now();backoff=2000;
    if(!CL.dirty)setWork({unsaved:false,rev:CL.rev,at:Date.now()});
  }catch(e){
    if(e instanceof TypeError||!navigator.onLine){CL.offline=true;CL.err=null}else CL.err=e.message||String(e);
    clearTimeout(saveT6);saveT6=setTimeout(()=>cloudSave(true),backoff);backoff=Math.min(backoff*2,60000)}
  finally{CL.saving=false;paintFile();
    if(CL.again||CL.dirty){CL.again=false;if(CL.dirty&&!CL.err&&!CL.offline){clearTimeout(saveT6);saveT6=setTimeout(()=>cloudSave(),600)}}
    await maybeReload()}};

/* ---- abrir / recargar: se guarda cómo estaba el proyecto en el servidor ---- */
openCloud=async function(pid,keepTurn){
  busy(true);
  try{
    const [{o,meta},pl]=await Promise.all([fetchBundle(pid),fetch(`/api/projects/${pid}/pdfs`,{credentials:'same-origin'}).then(r=>r.ok?r.json():{}).catch(()=>({}))]);
    if(CL.pid&&CL.pid!==pid&&CL.canEdit)API(`/api/projects/${CL.pid}/lock?device=${DEV}`,{method:'DELETE'}).catch(()=>{});
    await purgeWork(null);
    CL.pid=pid;CL.role=meta.role;CL.rev=meta.rev;CL.pdfs=pl||{};CL.pdfUp=new Set(Object.keys(CL.pdfs));CL.dirty=false;CL.err=null;CL.offline=false;CL.lock=null;
    CL.base=XO.norm(o);CL.q=[];CL.needReload=false;CL.resync=false;
    Object.keys(PDFMEM).forEach(k=>delete PDFMEM[k]);
    const cur=buildXP(o.project,meta.name||o.project.meta.name);
    FILE=null;
    await cloudStart(cur);
    history.replaceState(null,'','?p='+pid);
    CL.canEdit=CL.role!=='view';startSync();wsOpen();
    paintFile();
  }catch(e){console.error(e);toast('No pude abrir el proyecto: '+(e.message||e),5000);history.replaceState(null,'','/')}
  finally{busy(false)}};
reloadCloud=async function(silent){
  const pid=CL.pid,keep=CL.canEdit,vid=curV&&curV.id,m=mode;
  try{
    const Ts={};XP.vers.forEach(v=>{Ts[v.id]={};for(const k of Object.keys(v.P.views||{}))Ts[v.id][k]=v.P.views[k].T});
    const {o,meta}=await fetchBundle(pid);CL.rev=meta.rev;CL.dirty=false;CL.err=null;CL.base=XO.norm(o);CL.q=[];CL.needReload=false;CL.resync=false;
    const cur=buildXP(o.project,meta.name||XP.name);
    XP.vers.forEach(v=>{const t=Ts[v.id];if(t)for(const k of Object.keys(t)){if(v.P.views&&v.P.views[k]&&t[k])v.P.views[k].T=t[k]}});
    await cloudStart(XP.vers.find(v=>v.id===vid)||cur);CL.canEdit=keep;if(m!=='piz')showMode(m);paintFile();if(!silent)toast('Actualizado',1500)}
  catch(e){toast('No pude actualizar: '+(e.message||e),4000)}};
try{Object.defineProperty(window.__xs,'CL',{get(){return CL}});Object.defineProperty(window.__xs,'XO',{get(){return XO}})}catch(_){}
try{Object.defineProperty(window.__xs,'bundle',{get(){return bundleCloud}})}catch(_){}

/* ---- recuperar trabajo sin subir: con el guardado por partes ya no se pisa lo de los demás ----
   Se baja una copia de lo que había en este navegador (para no perderla) y se abre la versión de la nube. */
recoverCloud=async function(){
  const w=await workInfo();if(!w||!w.id)return;
  try{
    await openProj(w.id);
    if(XP){const data=await bundleNow();dl((XP.name||'proyecto')+' · copia local.json',data)}
    await dbDel('proj','__work');
    toast('Bajé una copia de lo que tenías sin subir. Abro la versión de la nube.',6000);
    if(w.cloud)openCloud(w.cloud);else XSX.home()}
  catch(e){toast('No pude recuperar: '+(e.message||e),4000)}};

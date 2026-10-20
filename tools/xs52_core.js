/* ===== XO: cambios pequeños sobre el documento del proyecto (se comporta IGUAL que server/app/ops.py) ===== */
const XO=(()=>{
  const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const isCont=x=>x!==null&&typeof x==='object';
  const FORBID={'__proto__':1,'constructor':1,'prototype':1};
  const keyOf=el=>{
    if(!isObj(el))return null;let k=el.id;
    if((k===undefined||k===null)&&isObj(el.meta))k=el.meta.id;
    if(typeof k==='string'||(typeof k==='number'&&Number.isInteger(k)))return String(k);
    return null};
  const find=(a,k)=>{for(let i=0;i<a.length;i++)if(keyOf(a[i])===k)return i;return -1};
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const eq=(a,b)=>{
    if(a===b)return true;
    if(!isCont(a)||!isCont(b))return false;
    if(Array.isArray(a)!==Array.isArray(b))return false;
    if(Array.isArray(a)){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!eq(a[i],b[i]))return false;return true}
    const ka=Object.keys(a),kb=Object.keys(b);if(ka.length!==kb.length)return false;
    for(const k of ka){if(!Object.prototype.hasOwnProperty.call(b,k)||!eq(a[k],b[k]))return false}return true};
  /* ---- partes que NO se comparten: son de cada persona (zoom, página actual, vistas, etc.) ---- */
  const skip=p=>{
    const n=p.length;
    if(n===1&&p[0]==='saved')return true;
    if(p[0]==='project'&&p[1]==='meta'){
      if(n===2)return false;
      return ['vers','updated','cur','name','id','created'].includes(p[2])}
    if(p[0]==='project'&&p[1]==='versions'&&n>=4){
      const f=p[3];
      if(f==='stats'&&p[4]==='at')return true;
      if(f==='rev'&&n>=5&&['saved','page','mode','dept'].includes(p[4]))return true;
      if(f==='P'&&n>=5){
        const k=p[4];
        if(n===5&&['saved','size','hide','payOn','payS','dragMode'].includes(k))return true;
        if(k==='views'&&n===7&&p[6]==='T')return true}}
    return false};
  /* ---- comparar dos documentos y sacar las operaciones ---- */
  const keyedArr=a=>{if(!a.length)return true;const s=new Set();for(const e of a){const k=keyOf(e);if(k===null||s.has(k))return false;s.add(k)}return true};
  function diffNode(a,b,path,out){
    if(skip(path))return;
    if(a===b)return;
    if(isObj(a)&&isObj(b)){
      for(const k of Object.keys(a))if(!Object.prototype.hasOwnProperty.call(b,k)){const p=path.concat(k);if(!skip(p))out.push({p,d:1})}
      for(const k of Object.keys(b)){
        const p=path.concat(k);if(skip(p))continue;
        if(!Object.prototype.hasOwnProperty.call(a,k)){out.push({p,v:clone(b[k])});continue}
        diffNode(a[k],b[k],p,out)}
      return}
    if(Array.isArray(a)&&Array.isArray(b)){
      if(!a.length&&!b.length)return;
      if(keyedArr(a)&&keyedArr(b)){
        const ka=a.map(keyOf),kb=b.map(keyOf),sa=new Set(ka),sb=new Set(kb),ia=new Map(a.map(e=>[keyOf(e),e]));
        for(const k of ka)if(!sb.has(k))out.push({p:path.concat('#'+k),d:1});
        for(const e of b){const k=keyOf(e);
          if(!sa.has(k))out.push({p:path.concat('#'+k),v:clone(e)});
          else diffNode(ia.get(k),e,path.concat('#'+k),out)}
        const expect=ka.filter(k=>sb.has(k)).concat(kb.filter(k=>!sa.has(k)));
        if(expect.join('\u0001')!==kb.join('\u0001'))out.push({p:path,o:kb});
        return}
      if(!eq(a,b))out.push({p:path,v:clone(b)});
      return}
    if(!eq(a,b))out.push({p:path,v:clone(b)})}
  function diff(a,b){const out=[];diffNode(a,b,[],out);return out}
  /* ---- aplicar una operación (mismas reglas que el servidor) ---- */
  class OpError extends Error{}
  function step(cur,seg){
    if(Array.isArray(cur)){
      if(seg[0]!=='#')throw new OpError('se esperaba una llave de lista');
      const i=find(cur,seg.slice(1));if(i<0)throw new OpError('ya no existe ese elemento');return cur[i]}
    if(isObj(cur)){
      if(!Object.prototype.hasOwnProperty.call(cur,seg))throw new OpError('ya no existe esa parte');return cur[seg]}
    throw new OpError('la ruta no entra ahí')}
  function check(op){
    if(!isObj(op)||!Array.isArray(op.p)||!op.p.length||op.p.length>24)throw new OpError('ruta inválida');
    for(const s of op.p)if(typeof s!=='string'||!s||s.length>200||FORBID[s])throw new OpError('ruta inválida');
    const n=['v','d','o'].filter(k=>Object.prototype.hasOwnProperty.call(op,k)).length;
    if(n!==1)throw new OpError('operación inválida');
    if('d' in op&&op.d!==1)throw new OpError('operación inválida');
    if('o' in op&&!(Array.isArray(op.o)&&op.o.every(x=>typeof x==='string')))throw new OpError('orden inválido')}
  function apply(root,op){
    check(op);const path=op.p;
    if('o' in op){
      let cur=root;for(const s of path)cur=step(cur,s);
      if(!Array.isArray(cur))throw new OpError('solo se reordenan listas');
      const by=new Map();for(const el of cur){const k=keyOf(el);if(k!==null)by.set(k,el)}
      const out=[],seen=new Set();
      for(const k of op.o)if(by.has(k)&&!seen.has(k)){out.push(by.get(k));seen.add(k)}
      for(const el of cur){const k=keyOf(el);if(k===null||!seen.has(k))out.push(el)}
      cur.splice(0,cur.length,...out);return}
    let parent=root;for(let i=0;i<path.length-1;i++)parent=step(parent,path[i]);
    const last=path[path.length-1];
    if(Array.isArray(parent)){
      if(last[0]!=='#')throw new OpError('se esperaba una llave de lista');
      const key=last.slice(1),i=find(parent,key);
      if('d' in op){if(i>=0)parent.splice(i,1);return}
      const v=clone(op.v);if(keyOf(v)!==key)throw new OpError('la llave no coincide con el elemento');
      if(i>=0)parent[i]=v;else parent.push(v);return}
    if(isObj(parent)){
      if('d' in op)delete parent[last];else parent[last]=clone(op.v);return}
    throw new OpError('la ruta no entra ahí')}
  /* el «P» de cada versión viaja como texto dentro del JSON: aquí se abre / se vuelve a cerrar */
  function norm(o){
    const d=clone(o);
    if(d&&d.project&&Array.isArray(d.project.versions))for(const v of d.project.versions)if(typeof v.P==='string'){try{v.P=JSON.parse(v.P)}catch(_){}}
    return d}
  return{keyOf,diff,apply,eq,clone,norm,skip,OpError}
})();
if(typeof module!=='undefined')module.exports=XO;

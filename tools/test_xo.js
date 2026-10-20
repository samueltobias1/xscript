// Prueba al azar: apply(a, diff(a,b)) debe dar b. Con "--fixture archivo" guarda casos para compararlos con Python.
const XO=require('./xs52_core.js');
let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
const ri=n=>Math.floor(rnd()*n);
const IDS=['a','b','c','d','e','f','g','h'];
function rscalar(){const t=ri(5);return t===0?ri(100):t===1?rnd()*1000:t===2?'t'+ri(50):t===3?null:(rnd()<.5)}
function rarr(depth){
  const t=ri(3);const n=ri(5);
  if(t===0){return Array.from({length:n},()=>rscalar())}
  if(t===1){const ids=IDS.slice().sort(()=>rnd()-.5).slice(0,n);return ids.map(id=>Object.assign({id},robj(depth+1)))}
  const ids=IDS.slice().sort(()=>rnd()-.5).slice(0,n);return ids.map(id=>({meta:{id,l:ri(9)},P:robj(depth+1)}))}
function robj(depth){
  const o={};const n=ri(4);
  for(let i=0;i<n;i++){const k=['x','y','pos','list','n','T'][ri(6)];
    const t=depth>3?0:ri(4);
    o[k]=t===0?rscalar():t===1?robj(depth+1):t===2?rarr(depth+1):rscalar()}
  return o}
function mutate(v,depth){
  if(Array.isArray(v)){
    const c=JSON.parse(JSON.stringify(v));
    const r=ri(6);
    if(r===0&&c.length)c.splice(ri(c.length),1);
    else if(r===1){const keyed=c.length&&XO.keyOf(c[0])!==null;if(keyed){const id=IDS[ri(8)];if(!c.some(e=>XO.keyOf(e)===id))c.splice(ri(c.length+1),0,c[0].meta?{meta:{id,l:1},P:{}}:{id,z:ri(9)})}else c.push(rscalar())}
    else if(r===2&&c.length>1){const i=ri(c.length),j=ri(c.length);const t=c[i];c[i]=c[j];c[j]=t}
    else if(c.length){const i=ri(c.length);c[i]=mutate(c[i],depth+1)}
    return c}
  if(v&&typeof v==='object'){
    const c=JSON.parse(JSON.stringify(v));const ks=Object.keys(c);const r=ri(5);
    if(r===0&&ks.length)delete c[ks[ri(ks.length)]];
    else if(r===1)c['n'+ri(3)]=depth>3?rscalar():[rscalar,()=>robj(depth+1),()=>rarr(depth+1)][ri(3)]();
    else if(ks.length){const k=ks[ri(ks.length)];c[k]=mutate(c[k],depth+1)}
    return c}
  return rnd()<.5?rscalar():v}
const N=+(process.argv[2]||5000),fix=process.argv.indexOf('--fixture')>0?process.argv[process.argv.indexOf('--fixture')+1]:null;
let bad=0,cases=[];
for(let i=0;i<N;i++){
  const a={root:robj(0),L:rarr(0)};let b=a;const m=1+ri(4);for(let j=0;j<m;j++)b=mutate(b,0);
  const ops=XO.diff(a,b);
  const t=XO.clone(a);
  try{for(const op of ops)XO.apply(t,op)}catch(e){bad++;if(bad<4)console.log('ERROR',e.message,JSON.stringify(ops).slice(0,300));continue}
  if(!XO.eq(t,b)){bad++;if(bad<4)console.log('DIFIERE',JSON.stringify(a).slice(0,200),JSON.stringify(ops).slice(0,400),JSON.stringify(b).slice(0,200))}
  else if(fix&&cases.length<300&&ops.length)cases.push({a,ops,b})}
console.log(N+' casos, '+bad+' con problema');
if(fix){require('fs').writeFileSync(fix,JSON.stringify(cases));console.log('guardé',cases.length,'casos en',fix)}
process.exit(bad?1:0)

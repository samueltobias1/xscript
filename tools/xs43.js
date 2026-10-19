/* ================= XSCRIPT 4.3 · proyecto en blanco (sin guion) ================= */
{
async function blankCloud(nm,vl,pg){
  const p=finishProject({app:'rayos-x',v:1,name:nm,blank:true,defPg:Math.round(pg*8),scenes:[],arcs:[],marks:[]});
  const v=mkVer(p,'',1,null);v.label=vl;
  const meta={id:uid(),name:nm,created:Date.now(),updated:Date.now(),cur:v.id,cfg:{},vers:[{id:v.id,label:vl,pdfName:'',added:v.added,hasPdf:false}]};
  const id=await createCloud({app:'xscript',v:3,project:{meta,versions:[{meta:meta.vers[0],P:serializeP(p),rev:null,stats:null,pdf:null}]}},nm,{});
  await openCloud(id)}
XSX.blankProject=()=>{
  xdlg({title:'Proyecto en blanco',sm:true,
    html:`<label class="nfl">Nombre del proyecto<input type="text" id="bpName" autocomplete="off" placeholder="Mi película"></label>
    <label class="nfl">Nombre de esta versión<input type="text" id="bpVer" autocomplete="off" placeholder="V1, Borrador…"></label>
    <label class="nfl">Páginas que vale cada tarjeta nueva<input type="number" id="bpPg" min="0.25" max="10" step="0.25" value="1"></label>
    <p style="margin:6px 0 0;color:var(--faint);font-size:12px;line-height:1.5">Empiezas sin guion: crea tarjetas con doble clic en el pizarrón o con «＋ Tarjeta». La duración de cada una (en páginas) se cambia dentro de la tarjeta y es la que arma el timeline y los porcentajes de Save the Cat.</p>`,
    init:d=>{d.querySelector('#bpVer').value='V1';d.querySelectorAll('input').forEach(i=>i.onkeydown=e=>e.stopPropagation());setTimeout(()=>d.querySelector('#bpName').focus(),50)},
    buttons:[{label:'Cancelar'},{label:'Crear',pri:true,fn:d=>{
      const nm=d.querySelector('#bpName').value.trim()||'Proyecto en blanco',vl=d.querySelector('#bpVer').value.trim()||'V1',pg=Math.max(.25,Math.min(10,+d.querySelector('#bpPg').value||1));
      (async()=>{busy(true);try{await blankCloud(nm,vl,pg);toast('Proyecto en blanco listo',2500)}catch(e){console.error(e);toast('No pude crear el proyecto: '+(e.message||e),5000)}finally{busy(false)}})()}}]})};
/* mensaje cuando el pizarrón está vacío */
const eb=document.createElement('div');eb.id='emptyb';eb.hidden=true;
eb.innerHTML='<b>Pizarrón en blanco</b><span>Haz doble clic donde quieras una tarjeta, o usa «＋ Tarjeta». Las tarjetas se ordenan de izquierda a derecha y arman el timeline.</span>';
board.appendChild(eb);
XSX.emptyHint=()=>{try{eb.hidden=!(P&&P.scenes.length===0&&view!=='arcs'&&XSX.mode==='piz')}catch(_){eb.hidden=true}};
}

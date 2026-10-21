/* ================= 5.4 · Invitados (modo Dios del dueño) ================= */
(function(){
  const fb=b=>b>=1e9?(b/1e9).toFixed(1)+' GB':b>=1e6?(b/1e6).toFixed(1)+' MB':Math.max(1,Math.round(b/1e3))+' KB';
  async function adminDlg(){
    const load=async()=>{const r=await fetch('/api/admin/guests',{credentials:'same-origin',cache:'no-store'});return r.ok?r.json():{guests:[],total_projects:0,total_bytes:0}};
    let D=await load();
    const render=d=>{
      d.querySelector('.agl').innerHTML=D.guests.length?D.guests.map(g=>`<div class="agr" data-e="${esc(g.email)}"><div class="agm"><b>${esc(g.name||g.email)}</b>${g.note?` <i>${esc(g.note)}</i>`:''}<small>${esc(g.email)} · ${g.last_login?'entró '+fdate2(g.last_login*1000):'aún no entra'}</small><small>${g.projects} proyecto${g.projects===1?'':'s'} · ${fb(g.bytes)}${g.last_update?' · cambió '+fdate2(g.last_update*1000):''}</small></div>
        <div class="aga">${g.projects?`<button class="btn" data-av="${esc(g.email)}">Ver proyectos</button>`:''}${g.fixed?'<span class="agfx" title="Está en el archivo .env del servidor">fijo</span>':`<button class="btn dng" data-x="${esc(g.email)}" title="Quitar acceso">✕</button>`}</div><div class="agp"></div></div>`).join(''):'<div class="hempty">Aún no hay invitados.</div>';
      d.querySelector('.agt').textContent=`Total en el servidor: ${D.total_projects} proyectos · ${fb(D.total_bytes)}`};
    xdlg({title:'Invitados a probar XSCRIPT',html:`<p style="color:var(--mute);font-size:13px;margin:0 0 10px">Un invitado entra con su cuenta de Google, crea sus propios proyectos y solo ve lo suyo. Tú puedes mirar sus proyectos (solo lectura).</p>
      <div class="shadd"><input type="email" id="agE" placeholder="correo de Google" autocomplete="off"><input type="text" id="agN" placeholder="nota (ej. Productor)" maxlength="60" autocomplete="off"><button class="btn pri" id="agA">Invitar</button></div>
      <p style="color:var(--faint);font-size:12px;margin:6px 0 12px">Mándale el link <b>${esc(location.origin)}</b>.</p><div class="agl"></div><p class="agt" style="color:var(--faint);font-size:12px;margin:12px 0 0"></p>`,
      init:d=>{render(d);
        const add=async()=>{const e=d.querySelector('#agE').value.trim(),n=d.querySelector('#agN').value.trim();if(!e)return;
          const x=await API('/api/admin/guests',{method:'POST',body:JSON.stringify({email:e,note:n}),headers:{'Content-Type':'application/json'}});
          if(!x.ok){toast(await errMsg(x),3500);return}d.querySelector('#agE').value='';d.querySelector('#agN').value='';D=await load();render(d);toast('Invitado: '+e,2500)};
        d.querySelector('#agA').onclick=add;d.querySelectorAll('#agE,#agN').forEach(i=>i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')add()});
        d.querySelector('.agl').addEventListener('click',async e=>{
          const x=e.target.closest('[data-x]'),v=e.target.closest("[data-av]");
          if(x){const em=x.dataset.x;askSure('¿Quitar el acceso de '+em+'? Sus proyectos se conservan en el servidor.','Quitar',async()=>{await API('/api/admin/guests/'+encodeURIComponent(em),{method:'DELETE'});D=await load();render(d)});return}
          if(v){const row=v.closest('.agr'),box=row.querySelector('.agp');
            if(box.innerHTML){box.innerHTML='';return}
            const r=await fetch('/api/admin/projects?owner='+encodeURIComponent(v.dataset.av),{credentials:'same-origin'});const L=r.ok?await r.json():[];
            box.innerHTML=L.map(p=>`<div class="agpr"><b>${esc(p.name)}</b><small>${fdate2(p.updated*1000)} · ${fb(p.size)}</small><button class="btn" data-ao="${p.id}">Abrir (solo lectura)</button></div>`).join('');return}
          const o=e.target.closest('[data-ao]');if(o){closeDlg();openCloud(o.dataset.ao)}})},
      buttons:[{label:'Listo',pri:true}]})}
  XSX.adminDlg=adminDlg;
})();

const SUPABASE_URL='https://afijjkklautapdqldmbs.supabase.co';
const SUPABASE_KEY='sb_publishable_glH8U1OaefjP1GRVERMOCQ_c_FzfFwQ';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const app=document.getElementById('app');
let currentUser=null,currentProfile=null,currentView='inicio',commercesCache=[];
const NAV_ADMIN=[['inicio','▣','Inicio'],['comercios','🏪','Comercios'],['obras','🏗️','Obras privadas'],['inspecciones','📋','Inspecciones'],['contribuyentes','👥','Contribuyentes'],['infracciones','⚠️','Infracciones'],['usuarios','👤','Usuarios'],['reportes','📊','Reportes']];
const NAV_INSPECTOR=[['inicio','▣','Inicio'],['comercios','🏪','Comercios'],['inspecciones','📋','Inspecciones'],['reportes','📊','Reportes']];
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function fmtDate(v){if(!v)return '—';try{return new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return v}}
function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
async function boot(){app.innerHTML='<div class="loading">Cargando SIMA 360°…</div>';const {data:{session}}=await sb.auth.getSession();if(!session)return renderLogin();currentUser=session.user;if(!await loadProfile()){await sb.auth.signOut();return renderLogin('Tu usuario no tiene un perfil habilitado.')}renderApp()}
async function loadProfile(){const {data,error}=await sb.from('profiles').select('id,full_name,email,role,active,photo_path').eq('id',currentUser.id).single();if(error||!data||!data.active)return false;currentProfile=data;return true}
let selectedLoginRole=null;
function renderLogin(error=''){currentUser=null;currentProfile=null;selectedLoginRole=null;app.innerHTML=`<section class="login-shell"><div class="login-brand"><div class="municipal-mark"><div class="municipal-icon">🏛️</div><div>Municipalidad<small style="display:block;font-weight:500;opacity:.78">Santo Tomé · Corrientes</small></div></div><div class="kicker">GESTIÓN MUNICIPAL INTELIGENTE</div><div class="hero-title">SIMA 360°</div><div class="hero-subtitle">Sistema Integral Municipal de Autogestión, Prevención y Control Inteligente</div><div class="hero-copy">Comercios más seguros, controles más ágiles y datos confiables para una gestión municipal moderna.</div><div class="feature-grid"><div class="feature-card"><span>🏪</span><strong>Registro de comercios</strong><small>Base municipal unificada</small></div><div class="feature-card"><span>📱</span><strong>Identificación con QR</strong><small>Acceso rápido y seguro</small></div><div class="feature-card"><span>📋</span><strong>Inspecciones digitales</strong><small>Actas, fotos y ubicación</small></div><div class="feature-card"><span>📊</span><strong>Información en tiempo real</strong><small>Reportes y seguimiento</small></div></div><div class="brand-footer">🛡️ Prevención · Control · Compromiso</div></div><div class="login-panel-wrap"><div class="login-card" id="loginCard"><div class="login-top"><div class="brand-mini">SIMA 360°</div><div class="place-mini">Santo Tomé, Corrientes</div></div><div id="roleStep"><h2>Seleccioná tu perfil</h2><div class="muted">Elegí cómo vas a ingresar al sistema.</div><div class="role-select-grid"><button type="button" class="role-select-card" data-login-role="admin"><img src="assets/icon-admin.jpg" alt="Administrador" class="role-select-img"><strong>Administrador</strong><small>Gestión completa</small></button><button type="button" class="role-select-card" data-login-role="inspector"><img src="assets/icon-inspector.jpg" alt="Inspector" class="role-select-img"><strong>Inspector</strong><small>Realizar inspecciones</small></button></div>${error?`<div class="form-error">${esc(error)}</div>`:''}</div><form id="loginForm" class="login-form-step" hidden><button type="button" class="back-role-btn" id="backRole">← Cambiar perfil</button><div class="selected-role-banner" id="selectedRoleBanner"></div><h2>Bienvenido</h2><div class="muted">Ingresá con tu correo electrónico y contraseña.</div><div class="field"><label>Correo electrónico</label><div class="input-wrap"><span>✉️</span><input id="email" type="email" autocomplete="username" required placeholder="usuario@correo.com"></div></div><div class="field"><label>Contraseña</label><div class="input-wrap"><span>🔒</span><input id="password" type="password" autocomplete="current-password" required placeholder="••••••••"></div></div><button class="primary-btn" id="loginBtn">Iniciar sesión →</button><div id="loginInlineError"></div></form></div></div></section>`;document.querySelectorAll('[data-login-role]').forEach(btn=>btn.addEventListener('click',()=>chooseLoginRole(btn.dataset.loginRole)));document.getElementById('loginForm').addEventListener('submit',login);document.getElementById('backRole').onclick=()=>renderLogin()}
function chooseLoginRole(role){selectedLoginRole=role;const roleStep=document.getElementById('roleStep'),form=document.getElementById('loginForm'),banner=document.getElementById('selectedRoleBanner');roleStep.hidden=true;form.hidden=false;banner.innerHTML=role==='admin'?'<img src="assets/icon-admin.jpg" alt="Administrador" class="selected-role-img"><div><strong>Administrador</strong><small>Gestión completa</small></div>':'<img src="assets/icon-inspector.jpg" alt="Inspector" class="selected-role-img"><div><strong>Inspector</strong><small>Realizar inspecciones</small></div>';document.getElementById('email').focus()}
async function login(e){e.preventDefault();const btn=document.getElementById('loginBtn'),errBox=document.getElementById('loginInlineError');errBox.innerHTML='';if(!selectedLoginRole){return renderLogin('Primero seleccioná Administrador o Inspector.')}btn.disabled=true;btn.textContent='Ingresando…';const email=document.getElementById('email').value.trim(),password=document.getElementById('password').value;const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){btn.disabled=false;btn.textContent='Iniciar sesión →';errBox.innerHTML='<div class="form-error">No se pudo iniciar sesión. Verificá correo y contraseña.</div>';return}currentUser=data.user;if(!await loadProfile()){await sb.auth.signOut();return renderLogin('Usuario inactivo o sin perfil habilitado.')}if(currentProfile.role!==selectedLoginRole){await sb.auth.signOut();const expected=selectedLoginRole==='admin'?'Administrador':'Inspector';return renderLogin('El usuario ingresado no corresponde al perfil '+expected+'.')}renderApp()}
function navIcon(id){
  const icons={
    inicio:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
    comercios:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16"/><path d="M5 10 7 4h10l2 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    obras:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18"/><path d="M6 21V8l6-4 6 4v13"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>',
    inspecciones:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 2h6v4H9z"/><path d="m9.5 12 1.5 1.5 3-3"/><path d="M9.5 17H15"/></svg>',
    contribuyentes:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.6-4 2.5-6 5.5-6s4.9 2 5.5 6"/><path d="M14.5 15.5c3.3 0 5.2 1.5 6 4.5"/></svg>',
    infracciones:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg>',
    usuarios:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.8-4.2 3.1-6.5 7-6.5s6.2 2.3 7 6.5"/></svg>',
    reportes:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V10"/><path d="M12 21V4"/><path d="M19 21v-7"/><path d="M3 21h18"/></svg>'
  };
  return icons[id]||'';
}
function renderApp(){
  const nav=currentProfile.role==='admin'?NAV_ADMIN:NAV_INSPECTOR;
  const initials=(currentProfile.full_name||'U').split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  app.innerHTML=`<div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <div class="side-brand">
        <div class="side-logo">360°</div>
        <div class="side-brand-copy">
          <strong>SIMA 360°</strong>
          <small>Gestión Municipal</small>
          <span>Santo Tomé · Corrientes</span>
        </div>
      </div>

      <div class="menu-title">NAVEGACIÓN</div>
      <nav class="nav">
        ${nav.map(([id,ic,txt])=>`<button data-view="${id}" class="${id===currentView?'active':''}">
          <span class="nav-icon">${navIcon(id)}</span>
          <span class="nav-label">${txt}</span>
          <span class="nav-arrow">›</span>
        </button>`).join('')}
      </nav>

      <div class="side-bottom">
        <div class="user-card">
          <div class="user-avatar">${esc(initials)}</div>
          <div class="user-card-copy">
            <strong>${esc(currentProfile.full_name)}</strong>
            <small>${currentProfile.role==='admin'?'Administrador':'Inspector'}</small>
          </div>
        </div>
        <button class="logout-btn" id="logout"><span>↪</span><span>Cerrar sesión</span></button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu" id="mobileMenu">☰</button>
          <div>
            <strong>SIMA 360°</strong>
            <small>· Santo Tomé, Corrientes</small>
          </div>
        </div>
        <small>${esc(currentProfile.full_name)}</small>
      </header>
      <div class="content" id="content"></div>
    </main>
  </div>`;

  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
  document.getElementById('logout').onclick=async()=>{await sb.auth.signOut();renderLogin()};
  document.getElementById('mobileMenu').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
  navigate(currentView)
}
function navigate(view){currentView=view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.getElementById('sidebar')?.classList.remove('open');renderView(view)}
async function renderView(view){const c=document.getElementById('content');c.innerHTML='<div class="loading">Cargando información…</div>';try{if(view==='inicio')return renderDashboard(c);if(view==='comercios')return renderCommerces(c);if(view==='inspecciones')return renderInspections(c);if(view==='usuarios')return renderUsers(c);if(view==='reportes')return renderReports(c);if(view==='obras')return renderSimpleTable(c,'Obras privadas','works','responsible,address,status,created_at');if(view==='contribuyentes')return renderSimpleTable(c,'Contribuyentes','contributors','name,dni_cuit,activity,status');if(view==='infracciones')return renderSimpleTable(c,'Infracciones','infractions','code,reason,status,infraction_date')}catch(e){console.error(e);c.innerHTML='<div class="panel"><div class="form-error">No se pudo cargar este módulo.</div></div>'}}
async function renderDashboard(c){const [{count:commerceCount},{count:inspectionCount},{count:workCount},{count:infractionCount}]=await Promise.all([sb.from('commerces').select('*',{count:'exact',head:true}),sb.from('inspections').select('*',{count:'exact',head:true}),sb.from('works').select('*',{count:'exact',head:true}),sb.from('infractions').select('*',{count:'exact',head:true})]);const {data:last}=await sb.from('inspections').select('id,inspected_at,status,act_number,commerces(business_name),profiles(full_name)').order('inspected_at',{ascending:false}).limit(5);c.innerHTML=`<div class="page-head"><div><h1>Panel de ${currentProfile.role==='admin'?'administración':'inspector'}</h1><p>Resumen general y estado actual del sistema.</p></div></div><div class="stats-grid"><div class="stat-card"><div class="stat-top"><div><div class="stat-label">Comercios</div><div class="stat-value">${commerceCount||0}</div></div><div class="stat-icon">🏪</div></div></div><div class="stat-card"><div class="stat-top"><div><div class="stat-label">Inspecciones</div><div class="stat-value">${inspectionCount||0}</div></div><div class="stat-icon">📋</div></div></div><div class="stat-card"><div class="stat-top"><div><div class="stat-label">Obras privadas</div><div class="stat-value">${workCount||0}</div></div><div class="stat-icon">🏗️</div></div></div><div class="stat-card"><div class="stat-top"><div><div class="stat-label">Infracciones</div><div class="stat-value">${infractionCount||0}</div></div><div class="stat-icon">⚠️</div></div></div></div><div class="quick-grid"><div class="quick-card" onclick="navigate('comercios')"><span>🏪</span><div><strong>Ver comercios</strong><div class="muted">Base municipal</div></div></div><div class="quick-card" onclick="navigate('inspecciones')"><span>📋</span><div><strong>Ver inspecciones</strong><div class="muted">Historial y seguimiento</div></div></div><div class="quick-card" onclick="navigate('reportes')"><span>📊</span><div><strong>Ver reportes</strong><div class="muted">Indicadores generales</div></div></div></div><div class="panel"><h3>Últimas inspecciones</h3>${last?.length?inspectionTable(last):'<div class="empty">Todavía no hay inspecciones registradas.</div>'}</div>`}
function inspectionTable(rows){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Comercio</th><th>Inspector</th><th>Expediente / Acta</th><th>Estado</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmtDate(r.inspected_at)}</td><td>${esc(r.commerces?.business_name||'—')}</td><td>${esc(r.profiles?.full_name||'—')}</td><td>${esc(r.act_number||'—')}</td><td><span class="badge ${r.status==='realizada'?'success':r.status==='observada'?'warning':''}">${esc(r.status||'—')}</span></td></tr>`).join('')}</tbody></table></div>`}
async function renderCommerces(c){const {data,error}=await sb.from('commerces').select('id,business_name,legal_name,cuit,commercial_license,address,sector,zone,status').order('business_name').limit(1000);if(error)throw error;commercesCache=data||[];c.innerHTML=`<div class="page-head"><div><h1>Comercios</h1><p>Base municipal unificada de establecimientos.</p></div><div class="toolbar"><input class="searchbox" id="commerceSearch" placeholder="Buscar comercio, dirección o CUIT"></div></div><div class="panel" id="commerceTable"></div>`;const render=rows=>document.getElementById('commerceTable').innerHTML=`<h3>${rows.length} comercios</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Comercio</th><th>CUIT</th><th>Habilitación</th><th>Dirección</th><th>Sector</th><th>Estado</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.business_name)}</strong><br><small class="muted">${esc(r.legal_name||'')}</small></td><td>${esc(r.cuit||'—')}</td><td>${esc(r.commercial_license||'—')}</td><td>${esc(r.address||'—')}</td><td>${esc(r.sector||'—')}</td><td><span class="badge ${r.status==='activo'?'success':''}">${esc(r.status||'—')}</span></td></tr>`).join('')}</tbody></table></div>`;render(commercesCache);document.getElementById('commerceSearch').oninput=e=>{const q=e.target.value.toLowerCase().trim();render(commercesCache.filter(r=>[r.business_name,r.legal_name,r.cuit,r.address,r.sector,r.zone].some(v=>String(v||'').toLowerCase().includes(q))))}}
async function renderInspections(c){
  const {data,error}=await sb.from('inspections').select('id,inspected_at,status,act_number,observations,qr_scanned,commerces(business_name,address),profiles(full_name)').order('inspected_at',{ascending:false}).limit(500);
  if(error)throw error;
  c.innerHTML=`<div class="page-head"><div><h1>Inspecciones</h1><p>Historial general de comercios y obras privadas.</p></div><div class="toolbar"><button class="btn primary" id="newInspection">+ Nueva inspección</button></div></div><div class="panel">${data?.length?inspectionTable(data):'<div class="empty">Todavía no hay inspecciones registradas.</div>'}</div>`;
  document.getElementById('newInspection').onclick=openNewInspectionModal;
}
async function openNewInspectionModal(){
  let commerces=commercesCache;
  if(!commerces.length){
    const {data,error}=await sb.from('commerces').select('id,business_name,address,status').eq('active',true).order('business_name').limit(1000);
    if(error){toast('No se pudo cargar la lista de comercios.');return}
    commerces=data||[];
  }
  const modal=document.createElement('div');
  modal.className='modal-backdrop';
  modal.innerHTML=`<div class="modal-card">
    <div class="modal-head"><div><h2>Nueva inspección</h2><p>Inspector: <strong>${esc(currentProfile.full_name)}</strong></p></div><button class="modal-close" type="button" aria-label="Cerrar">×</button></div>
    <form id="inspectionForm">
      <div class="form-grid">
        <div class="field span-2"><label>Comercio *</label><select id="inspectionCommerce" required><option value="">Seleccionar comercio…</option>${commerces.map(x=>`<option value="${esc(x.id)}">${esc(x.business_name)} — ${esc(x.address||'Sin dirección')}</option>`).join('')}</select></div>
        <div class="field"><label>N° de Expediente / Acta</label><input id="inspectionAct" type="text" placeholder="Ej.: EXP-2026-001"></div>
        <div class="field"><label>Estado</label><select id="inspectionStatus"><option value="realizada">Realizada</option><option value="observada">Observada</option><option value="pendiente">Pendiente</option></select></div>
        <div class="field span-2"><label>Observaciones</label><textarea id="inspectionObs" rows="4" placeholder="Detalle de la inspección, hallazgos y recomendaciones…"></textarea></div>
        <div class="field span-2"><label>Ubicación GPS</label><div class="gps-row"><button class="btn" type="button" id="getGps">📍 Tomar ubicación actual</button><span id="gpsStatus" class="muted">Sin ubicación registrada</span></div></div>
        <div class="field span-2"><label>Fotografías</label><input id="inspectionPhotos" type="file" accept="image/*" multiple capture="environment"><div class="field-help">Las imágenes se comprimen automáticamente antes de subirlas. Máximo 6 fotos.</div><div id="photoSummary" class="photo-summary"></div></div>
      </div>
      <div id="inspectionError"></div>
      <div class="modal-actions"><button type="button" class="btn" id="cancelInspection">Cancelar</button><button type="submit" class="btn primary" id="saveInspection">Guardar inspección</button></div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  let gps={latitude:null,longitude:null,accuracy:null};
  const close=()=>modal.remove();
  modal.querySelector('.modal-close').onclick=close;
  modal.querySelector('#cancelInspection').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.querySelector('#getGps').onclick=()=>{
    const status=modal.querySelector('#gpsStatus');
    if(!navigator.geolocation){status.textContent='Este dispositivo no permite geolocalización.';return}
    status.textContent='Obteniendo ubicación…';
    navigator.geolocation.getCurrentPosition(
      p=>{gps={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy};status.textContent=`${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} · precisión ±${Math.round(gps.accuracy)} m`},
      ()=>{status.textContent='No se pudo obtener la ubicación. Revisá el permiso del navegador.'},
      {enableHighAccuracy:true,timeout:12000,maximumAge:0}
    );
  };
  modal.querySelector('#inspectionPhotos').onchange=e=>{
    const files=[...e.target.files];
    if(files.length>6){
      e.target.value='';
      modal.querySelector('#photoSummary').textContent='Podés seleccionar hasta 6 fotografías.';
      return;
    }
    const total=files.reduce((n,f)=>n+f.size,0);
    modal.querySelector('#photoSummary').textContent=files.length?`${files.length} foto(s) seleccionada(s) · tamaño original ${formatBytes(total)}`:'';
  };
  modal.querySelector('#inspectionForm').onsubmit=e=>saveInspection(e,modal,gps,close);
}
function formatBytes(bytes){if(!bytes)return '0 KB';const kb=bytes/1024;return kb<1024?`${kb.toFixed(0)} KB`:`${(kb/1024).toFixed(1)} MB`}
async function compressImage(file,maxDimension=1600,quality=.76){
  if(!file.type.startsWith('image/'))throw new Error('Archivo no válido');
  const image=await loadImage(file);
  let width=image.width,height=image.height;
  const scale=Math.min(1,maxDimension/Math.max(width,height));
  width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(image,0,0,width,height);
  const preferred='image/webp';
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,preferred,quality));
  if(!blob)throw new Error('No se pudo comprimir la imagen');
  return blob;
}
function loadImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la imagen'))};
    img.src=url;
  });
}
async function saveInspection(e,modal,gps,close){
  e.preventDefault();
  const errorBox=modal.querySelector('#inspectionError');
  const saveBtn=modal.querySelector('#saveInspection');
  errorBox.innerHTML='';
  const commerceId=modal.querySelector('#inspectionCommerce').value;
  const act=modal.querySelector('#inspectionAct').value.trim();
  const status=modal.querySelector('#inspectionStatus').value;
  const observations=modal.querySelector('#inspectionObs').value.trim();
  const photoInput=modal.querySelector('#inspectionPhotos');
  const files=[...photoInput.files];
  if(!commerceId){errorBox.innerHTML='<div class="form-error">Seleccioná un comercio.</div>';return}
  if(files.length>6){errorBox.innerHTML='<div class="form-error">El máximo es de 6 fotografías.</div>';return}
  saveBtn.disabled=true;saveBtn.textContent='Guardando…';
  try{
    const compressed=[];
    let compressedBytes=0;
    for(const file of files){
      const blob=await compressImage(file);
      compressed.push(blob);compressedBytes+=blob.size;
    }
    if(files.length) modal.querySelector('#photoSummary').textContent=`Fotos comprimidas: ${formatBytes(compressedBytes)} en total`;
    const now=new Date().toISOString();
    const {data:inspection,error:insertError}=await sb.from('inspections').insert({
      commerce_id:commerceId,
      inspector_id:currentUser.id,
      inspected_at:now,
      latitude:gps.latitude,
      longitude:gps.longitude,
      gps_accuracy_m:gps.accuracy,
      qr_scanned:false,
      status,
      observations:observations||null,
      act_number:act||null,
      target_type:'commerce'
    }).select('id').single();
    if(insertError)throw insertError;
    const photoErrors=[];
    for(let i=0;i<compressed.length;i++){
      const blob=compressed[i];
      const path=`${currentUser.id}/${inspection.id}/${Date.now()}-${i}.webp`;
      const {error:uploadError}=await sb.storage.from('inspection-photos').upload(path,blob,{contentType:'image/webp',upsert:false});
      if(uploadError){photoErrors.push(uploadError.message);continue}
      const {error:photoRowError}=await sb.from('inspection_photos').insert({
        inspection_id:inspection.id,
        storage_path:path,
        photo_type:'evidencia',
        uploaded_by:currentUser.id,
        description:'Evidencia fotográfica de inspección'
      });
      if(photoRowError)photoErrors.push(photoRowError.message);
    }
    const {data:pending}=await sb.from('inspection_plan_items').select('id').eq('commerce_id',commerceId).eq('status','pendiente').order('created_at').limit(1);
    if(pending?.length){
      await sb.from('inspection_plan_items').update({
        status:'inspeccionado',
        completed_inspection_id:inspection.id,
        completed_by:currentUser.id,
        completed_by_name:currentProfile.full_name,
        completed_at:now
      }).eq('id',pending[0].id);
    }
    close();
    toast(photoErrors.length?'Inspección guardada. Algunas fotos no pudieron subirse.':'Inspección guardada correctamente.');
    renderView('inspecciones');
  }catch(err){
    console.error(err);
    errorBox.innerHTML=`<div class="form-error">No se pudo guardar la inspección: ${esc(err.message||'error desconocido')}</div>`;
    saveBtn.disabled=false;saveBtn.textContent='Guardar inspección';
  }
}
async function renderUsers(c){if(currentProfile.role!=='admin'){c.innerHTML='<div class="panel"><div class="form-error">Solo el administrador puede consultar usuarios.</div></div>';return}const {data,error}=await sb.from('profiles').select('full_name,email,role,active').order('full_name');if(error)throw error;c.innerHTML=`<div class="page-head"><div><h1>Usuarios</h1><p>Administradores e inspectores registrados.</p></div></div><div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>${(data||[]).map(u=>`<tr><td><strong>${esc(u.full_name)}</strong></td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td><span class="badge ${u.active?'success':'danger'}">${u.active?'Activo':'Inactivo'}</span></td></tr>`).join('')}</tbody></table></div></div>`}
async function renderReports(c){const [{data:plan},{data:comms},{data:insps}]=await Promise.all([sb.from('inspection_plan_items').select('status'),sb.from('commerces').select('sector,status'),sb.from('inspections').select('status,inspected_at')]);const pc=(plan||[]).reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),sectors={};(comms||[]).forEach(r=>{const s=r.sector||'Sin sector';sectors[s]=(sectors[s]||0)+1});const rows=Object.entries(sectors).sort((a,b)=>b[1]-a[1]).slice(0,6),max=Math.max(1,...rows.map(x=>x[1]));c.innerHTML=`<div class="page-head"><div><h1>Reportes y estadísticas</h1><p>Datos que se convierten en mejores decisiones.</p></div></div><div class="report-grid"><div class="report-card"><h3>Estado de inspecciones planificadas</h3><div class="bar-row"><span>Pendientes</span><div class="bar"><i style="width:${(pc.pendiente||0)/Math.max(1,(plan||[]).length)*100}%"></i></div><strong>${pc.pendiente||0}</strong></div><div class="bar-row"><span>Inspeccionados</span><div class="bar"><i style="width:${(pc.inspeccionado||0)/Math.max(1,(plan||[]).length)*100}%"></i></div><strong>${pc.inspeccionado||0}</strong></div></div><div class="report-card"><h3>Inspecciones registradas</h3><div class="stat-value">${(insps||[]).length}</div><div class="muted">Total histórico</div></div><div class="report-card"><h3>Comercios por sector</h3>${rows.map(([s,n])=>`<div class="bar-row"><span>${esc(s)}</span><div class="bar"><i style="width:${n/max*100}%"></i></div><strong>${n}</strong></div>`).join('')||'<div class="empty">Sin datos</div>'}</div><div class="report-card"><h3>Base de comercios</h3><div class="stat-value">${(comms||[]).length}</div><div class="muted">Registros disponibles</div></div></div>`}
async function renderSimpleTable(c,title,table,fields){const {data,error}=await sb.from(table).select(fields).limit(500);if(error)throw error;const keys=fields.split(',');c.innerHTML=`<div class="page-head"><div><h1>${title}</h1><p>Consulta general del módulo.</p></div></div><div class="panel">${data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr>${keys.map(k=>`<th>${esc(k.replaceAll('_',' '))}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${keys.map(k=>`<td>${esc(r[k]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="empty">Todavía no hay registros.</div>'}</div>`}
window.navigate=navigate;sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')renderLogin()});boot();
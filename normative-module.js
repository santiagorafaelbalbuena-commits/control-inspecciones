import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  "https://afijjkklautapdqldmbs.supabase.co",
  "sb_publishable_glH8U1OaefjP1GRVERMOCQ_c_FzfFwQ"
);

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = (v="") => String(v).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const fmt = v => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
};
let catalog = null;
let profile = null;
let saving = false;

async function identity(){
  const res = await db.auth.getSession();
  const session = res.data.session;
  if (!session || !session.user) return {session:null,profile:null};
  if (!profile || profile.id !== session.user.id){
    const p = await db.from("profiles").select("id,full_name,role,active").eq("id",session.user.id).maybeSingle();
    profile = p.data || null;
  }
  return {session,profile};
}

async function getCatalog(){
  if (catalog) return catalog;
  const r = await db.from("normative_catalog")
    .select("id,code,title,issuing_body,jurisdiction,category,summary,source_url,sort_order")
    .eq("active",true).order("sort_order").order("code");
  if (r.error) throw r.error;
  catalog = r.data || [];
  return catalog;
}

function toast(msg, bad=false){
  let t = $("#simaNormToast");
  if (!t){
    t = document.createElement("div");
    t.id = "simaNormToast";
    document.body.appendChild(t);
  }
  t.className = "sima-norm-toast show" + (bad ? " bad" : "");
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 4200);
}

function navButton(){
  const side = $("#mainSidebar");
  if (!side || $("[data-sima-norm-nav]",side)) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "navbtn";
  b.setAttribute("data-sima-norm-nav","1");
  b.innerHTML = "<span>NM</span>Normativa H&amp;S";
  b.addEventListener("click", showNormativa);
  side.insertBefore(b,$(".sidebar-brand",side));
}

async function showNormativa(){
  const content = $(".content");
  if (!content) return;
  $$(".navbtn").forEach(b => b.classList.remove("active"));
  const nb = $("[data-sima-norm-nav]");
  if (nb) nb.classList.add("active");
  content.innerHTML =
    '<div class="page-title"><div><h1>Normativa H&amp;S</h1><p>Referencias preventivas para apoyar el criterio técnico del inspector.</p></div></div>' +
    '<div class="sima-norm-alert"><b>⚖ Uso orientativo</b><span>SIMA 360° sugiere referencias para documentar técnicamente una inspección. El inspector decide qué normativa vincular. No constituye sanción, declaración de infracción ni dictamen legal.</span></div>' +
    '<div class="panel"><div class="sima-norm-filters"><div class="field"><label>Buscar</label><input id="normSearch" placeholder="Ley, decreto, resolución o tema..."></div><div class="field"><label>Categoría</label><select id="normCategory"><option value="">Todas</option></select></div></div><div class="small" id="normCount">Cargando...</div></div>' +
    '<div id="normCards" class="sima-norm-grid"><div class="panel">Cargando normativa...</div></div>';
  try{
    const rows = await getCatalog();
    const cats = Array.from(new Set(rows.map(x=>x.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"es"));
    $("#normCategory").innerHTML = '<option value="">Todas</option>' + cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");
    const render = () => {
      const q = ($("#normSearch").value || "").toLowerCase();
      const cat = $("#normCategory").value || "";
      const list = rows.filter(n => (!cat || n.category===cat) && (!q || (n.code+" "+n.title+" "+n.category+" "+(n.summary||"")).toLowerCase().includes(q)));
      $("#normCount").textContent = "Mostrando "+list.length+" de "+rows.length+" referencias preventivas";
      $("#normCards").innerHTML = list.length ? list.map(n =>
        '<article class="sima-norm-card"><div class="sima-norm-top"><span>'+esc(n.code)+'</span><small>'+esc(n.category)+'</small></div><h3>'+esc(n.title)+'</h3><div class="small">'+esc(n.issuing_body||"")+' · '+esc(n.jurisdiction||"Nacional")+'</div><p>'+esc(n.summary||"")+'</p>'+(n.source_url?'<a class="secondary sima-source" target="_blank" rel="noopener" href="'+esc(n.source_url)+'">Ver fuente oficial ↗</a>':"")+'</article>'
      ).join("") : '<div class="panel notice">No se encontraron referencias.</div>';
    };
    $("#normSearch").addEventListener("input",render);
    $("#normCategory").addEventListener("change",render);
    render();
  }catch(e){
    $("#normCards").innerHTML = '<div class="panel error">No se pudo cargar la normativa: '+esc(e.message||e)+'</div>';
  }
}

function dashboardCard(){
  const c = $(".route-dashboard .content");
  if (!c || $("[data-sima-norm-callout]",c)) return;
  const first = $(".panel",c);
  if (!first) return;
  const d = document.createElement("div");
  d.className = "sima-norm-callout";
  d.setAttribute("data-sima-norm-callout","1");
  d.innerHTML = '<div><span>⚖ MARCO PREVENTIVO</span><b>Fundamento normativo sugerido</b><p>Las observaciones pueden quedar vinculadas a normativa de Higiene y Seguridad, siempre con carácter orientativo.</p></div><button type="button" class="secondary">Ver Normativa H&amp;S</button>';
  $("button",d).addEventListener("click",showNormativa);
  first.parentNode.insertBefore(d,first);
}

function inspectorCard(){
  const a = $(".route-inspector-home .inspector-actions");
  if (!a || $("[data-sima-norm-home]",a)) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "big-action sima-norm-home";
  b.setAttribute("data-sima-norm-home","1");
  b.innerHTML = '<span>NM</span> NORMATIVA H&amp;S<small>Consultar referencias preventivas</small>';
  b.addEventListener("click",showNormativa);
  a.appendChild(b);
}

function editorHtml(i,rows){
  return '<section class="sima-norm-editor" data-norm-editor><div class="sima-norm-editor-head"><b>Sugerencia preventiva '+i+'</b><button type="button" class="ghost" data-remove>Quitar</button></div>' +
  '<div class="form-grid sima-norm-editor-grid">' +
  '<div class="field wide"><label>Normativa sugerida</label><select data-reg><option value="">Seleccionar...</option>'+rows.map(n=>'<option value="'+n.id+'">'+esc(n.code)+' · '+esc(n.title)+'</option>').join("")+'<option value="custom">Otra normativa / provincial / municipal</option></select></div>' +
  '<div class="field custom-reg" hidden><label>Norma / código</label><input data-code placeholder="Ej.: Ordenanza N° ..."></div>' +
  '<div class="field custom-reg" hidden><label>Título / descripción</label><input data-title></div>' +
  '<div class="field"><label>Área / riesgo</label><input data-category placeholder="Ej.: Riesgo eléctrico"></div>' +
  '<div class="field"><label>Valoración técnica</label><select data-assessment><option value="sugerencia_preventiva">Sugerencia preventiva</option><option value="requiere_atencion">Requiere atención</option><option value="adecuado">Adecuado</option><option value="no_aplica">No aplica</option></select></div>' +
  '<div class="field wide"><label>Artículo / Anexo / referencia (opcional)</label><input data-article></div>' +
  '<div class="field wide"><label>Hallazgo o situación observada *</label><textarea rows="3" data-finding placeholder="Describí objetivamente lo observado"></textarea></div>' +
  '<div class="field wide"><label>Sugerencia técnica preventiva *</label><textarea rows="3" data-rec placeholder="Indicá la medida preventiva sugerida, sin formular una sanción"></textarea></div>' +
  '<div class="field wide"><label>Nota adicional</label><textarea rows="2" data-notes></textarea></div></div><div data-summary></div></section>';
}

function wireEditor(card,rows){
  const sel = $("[data-reg]",card);
  const update = () => {
    const custom = sel.value === "custom";
    $$(".custom-reg",card).forEach(x=>x.hidden=!custom);
    const n = rows.find(x=>x.id===sel.value);
    const sum = $("[data-summary]",card);
    if (custom){
      sum.innerHTML = '<div class="sima-selected">Podés registrar una referencia provincial, municipal u otra norma que el inspector considere pertinente.</div>';
    }else if(n){
      if (!$("[data-category]",card).value) $("[data-category]",card).value = n.category || "";
      sum.innerHTML = '<div class="sima-selected"><b>'+esc(n.code)+' · '+esc(n.title)+'</b><span>'+esc(n.summary||"")+'</span>'+(n.source_url?'<a target="_blank" rel="noopener" href="'+esc(n.source_url)+'">Fuente oficial ↗</a>':"")+'</div>';
    }else sum.innerHTML="";
  };
  sel.addEventListener("change",update);
  $("[data-remove]",card).addEventListener("click",()=>card.remove());
}

function collect(form,rows){
  const out = [];
  $$("[data-norm-editor]",form).forEach(card=>{
    const v = $("[data-reg]",card).value;
    const custom = v==="custom";
    const n = rows.find(x=>x.id===v);
    const finding = $("[data-finding]",card).value.trim();
    const rec = $("[data-rec]",card).value.trim();
    if (!v && !finding && !rec) return;
    const code = (custom?$("[data-code]",card).value:(n?n.code:"")).trim();
    const title = (custom?$("[data-title]",card).value:(n?n.title:"")).trim();
    if (!v || !code || !finding || !rec) throw new Error("Completá normativa, hallazgo y sugerencia técnica en cada fundamento agregado.");
    out.push({
      regulation_id: custom?null:n.id,
      regulation_code_snapshot:code,
      regulation_title_snapshot:title||null,
      category:$("[data-category]",card).value.trim() || (n?n.category:null),
      assessment:$("[data-assessment]",card).value,
      article_reference:$("[data-article]",card).value.trim()||null,
      finding:finding,
      recommendation:rec,
      notes:$("[data-notes]",card).value.trim()||null
    });
  });
  return out;
}

async function saveWithNorms(form,suggestions){
  if (saving) return;
  saving = true;
  const submit = $("button:not([type]),button[type='submit']",form);
  const old = submit ? submit.textContent : "";
  if (submit){submit.disabled=true;submit.textContent="Guardando...";}
  try{
    const id = await identity();
    if (!id.session) throw new Error("La sesión venció. Volvé a iniciar sesión.");
    const val = n => ($("#"+n,form) ? $("#"+n,form).value.trim() : "");
    const type = val("target_type");
    const commerce = val("commerce_id") || null;
    const work = val("work_id") || null;
    if (type==="commerce" && !commerce) throw new Error("Seleccioná un comercio.");
    if (type==="work" && !work) throw new Error("Seleccioná una obra.");
    const payload = {
      target_type:type,
      commerce_id:type==="commerce"?commerce:null,
      work_id:type==="work"?work:null,
      inspector_id:id.session.user.id,
      act_number:val("act_number")||null,
      status:val("istatus"),
      observations:val("observations")||null,
      regularization_deadline:val("regularization_deadline")||null,
      qr_scanned:Boolean(sessionStorage.getItem("selected_target"))
    };
    if (navigator.geolocation){
      try{
        const p = await new Promise((ok,no)=>navigator.geolocation.getCurrentPosition(ok,no,{enableHighAccuracy:true,timeout:8000}));
        payload.latitude=p.coords.latitude; payload.longitude=p.coords.longitude; payload.gps_accuracy_m=p.coords.accuracy;
      }catch(e){}
    }
    const ins = await db.from("inspections").insert(payload).select().single();
    if (ins.error) throw ins.error;
    const rows = suggestions.map(s=>Object.assign({},s,{inspection_id:ins.data.id,inspector_id:id.session.user.id}));
    const nr = await db.from("inspection_normative_suggestions").insert(rows);
    if (nr.error) throw new Error("La inspección se guardó, pero no se pudo guardar el fundamento preventivo: "+nr.error.message);

    const plan = sessionStorage.getItem("selected_plan_item") || "";
    if (plan && type==="commerce"){
      const pr = await db.from("inspection_plan_items").update({status:"inspeccionado",completed_inspection_id:ins.data.id,completed_by:id.session.user.id,completed_at:new Date().toISOString()}).eq("id",plan).eq("commerce_id",commerce);
      if (pr.error) toast("La inspección quedó guardada, pero la planilla no pudo actualizarse.",true);
    }

    const file = $("#photo",form) && $("#photo",form).files ? $("#photo",form).files[0] : null;
    if (file){
      const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
      const path=id.session.user.id+"/"+ins.data.id+"/evidencia-"+Date.now()+"."+ext;
      const up=await db.storage.from("inspection-photos").upload(path,file,{upsert:false});
      if(!up.error) await db.from("inspection_photos").insert({inspection_id:ins.data.id,storage_path:path,photo_type:"acta",uploaded_by:id.session.user.id,description:val("photo_description")||null});
    }

    sessionStorage.removeItem("selected_target");
    sessionStorage.removeItem("selected_plan_item");
    const back=sessionStorage.getItem("inspection_return_route")||"";
    sessionStorage.removeItem("inspection_return_route");
    toast("Inspección y sugerencias preventivas guardadas.");
    const go = back==="planilla" ? $("[data-route='planilla']") : $("[data-route='mis-inspecciones']");
    if (go) go.click(); else location.reload();
  }catch(e){
    toast(e.message||String(e),true);
  }finally{
    saving=false;
    if(submit){submit.disabled=false;submit.textContent=old||"Guardar inspección";}
  }
}

async function inspectionForm(){
  const form = $(".route-nueva-inspeccion #inspectionForm");
  if (!form || form.dataset.normReady==="1") return;
  form.dataset.normReady="1";
  let rows=[];
  try{rows=await getCatalog();}catch(e){}
  if(!form.isConnected) return;
  const actions=$(".actions",form);
  if(!actions) return;
  const box=document.createElement("div");
  box.className="wide sima-norm-builder";
  box.innerHTML='<div class="sima-norm-builder-head"><div><span>⚖ FUNDAMENTO PREVENTIVO</span><h3>Sugerencias normativas</h3><p>El inspector documenta la referencia y la medida preventiva. SIMA 360° no determina infracciones ni aplica sanciones.</p></div><button type="button" class="secondary" data-addnorm>+ Agregar sugerencia</button></div><div class="sima-norm-alert compact"><b>Carácter orientativo</b><span>Verificá la aplicabilidad concreta según actividad, jurisdicción y situación observada.</span></div><div data-normlist></div>';
  form.insertBefore(box,actions);
  let seq=0;
  $("[data-addnorm]",box).addEventListener("click",()=>{
    const w=document.createElement("div");
    w.innerHTML=editorHtml(++seq,rows);
    const card=w.firstElementChild;
    $("[data-normlist]",box).appendChild(card);
    wireEditor(card,rows);
  });
  form.addEventListener("submit",async e=>{
    let suggestions=[];
    try{suggestions=collect(form,rows);}catch(err){e.preventDefault();e.stopImmediatePropagation();toast(err.message,true);return;}
    if(!suggestions.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    await saveWithNorms(form,suggestions);
  },true);
}

function assessment(v){
  return ({sugerencia_preventiva:"Sugerencia preventiva",requiere_atencion:"Requiere atención",adecuado:"Adecuado",no_aplica:"No aplica"})[v] || "Sugerencia preventiva";
}

async function suggestionPanel(mode){
  const content = mode==="admin" ? $(".route-inspecciones .content") : $(".route-mis-inspecciones .content");
  if (!content || $("[data-sima-suggestions]",content)) return;
  const p=document.createElement("div");
  p.className="panel sima-suggestion-panel";
  p.setAttribute("data-sima-suggestions","1");
  p.innerHTML='<div class="panel-head"><h3>⚖ Fundamentos preventivos sugeridos</h3><span>Cargando...</span></div><div class="small">Las referencias registradas son orientativas y no constituyen sanción ni declaración de infracción.</div><div class="sima-suggestion-list"><div class="notice top-gap">Cargando...</div></div>';
  content.appendChild(p);
  try{
    const me=await identity();
    let iq=db.from("inspections").select("id,inspected_at,target_type,act_number,commerces(business_name,address),works(responsible,address),profiles!inspections_inspector_id_fkey(full_name)").order("inspected_at",{ascending:false}).limit(300);
    if(mode==="inspector" && me.session) iq=iq.eq("inspector_id",me.session.user.id);
    const results=await Promise.all([
      iq,
      db.from("inspection_normative_suggestions").select("id,inspection_id,regulation_code_snapshot,regulation_title_snapshot,category,assessment,article_reference,finding,recommendation,notes,created_at").order("created_at",{ascending:false}).limit(600)
    ]);
    if(results[0].error) throw results[0].error;
    if(results[1].error) throw results[1].error;
    const map=new Map((results[0].data||[]).map(i=>[i.id,i]));
    const list=(results[1].data||[]).filter(s=>map.has(s.inspection_id));
    $(".panel-head span",p).textContent=list.length+" sugerencia"+(list.length===1?"":"s");
    $(".sima-suggestion-list",p).innerHTML=list.length ? list.map(s=>{
      const i=map.get(s.inspection_id);
      const target=i.target_type==="work" ? ((i.works&&i.works.responsible)||"Obra") : ((i.commerces&&i.commerces.business_name)||"Comercio");
      const inspector=i.profiles&&i.profiles.full_name ? i.profiles.full_name : "—";
      return '<article class="sima-suggestion-card"><div class="sima-suggestion-meta"><b>'+esc(target)+'</b><span>'+esc(fmt(i.inspected_at))+'</span></div><div class="small">Inspector: <b>'+esc(inspector)+'</b> · Expediente: '+esc(i.act_number||"—")+'</div><div class="sima-ref"><span>'+esc(s.regulation_code_snapshot)+'</span><b>'+esc(s.regulation_title_snapshot||"")+'</b></div><div class="sima-status '+esc(s.assessment||"sugerencia_preventiva")+'">'+esc(assessment(s.assessment))+'</div>'+(s.category?'<div class="small">Área / riesgo: '+esc(s.category)+'</div>':"")+(s.article_reference?'<div class="small">Artículo / referencia: '+esc(s.article_reference)+'</div>':"")+'<p><b>Hallazgo / situación:</b> '+esc(s.finding)+'</p><p><b>Sugerencia técnica:</b> '+esc(s.recommendation)+'</p>'+(s.notes?'<div class="small">Nota: '+esc(s.notes)+'</div>':"")+'</article>';
    }).join("") : '<div class="notice top-gap">Todavía no hay sugerencias normativas registradas.</div>';
  }catch(e){
    $(".sima-suggestion-list",p).innerHTML='<div class="error top-gap">No se pudieron cargar los fundamentos preventivos: '+esc(e.message||e)+'</div>';
  }
}

function scan(){
  navButton();
  dashboardCard();
  inspectorCard();
  inspectionForm();
  if($(".route-inspecciones .content")) suggestionPanel("admin");
  if($(".route-mis-inspecciones .content")) suggestionPanel("inspector");
}

let tm=null;
new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(scan,80);}).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan); else scan();

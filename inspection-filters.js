(()=>{
  const normalize=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const rowDay=row=>{
    const txt=row.cells?.[0]?.textContent||"";
    const m=txt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if(!m)return "";
    return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  };
  function enhance(){
    const route=document.querySelector(".route-inspecciones");
    if(!route)return;
    const panel=route.querySelector(".content .panel");
    const table=panel?.querySelector("table");
    if(!panel||!table||panel.dataset.filtersReady==="1")return;

    panel.dataset.filtersReady="1";
    const headers=table.querySelectorAll("thead th");
    if(headers[3])headers[3].textContent="N° Expediente";

    const rows=[...table.querySelectorAll("tbody tr")];
    const inspectors=[...new Set(rows.map(r=>r.cells?.[2]?.textContent?.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));

    const box=document.createElement("div");
    box.className="inspection-filter-panel-overlay";
    box.innerHTML=`
      <div class="inspection-filters-overlay">
        <label><span>Inspector</span><select id="ifInspector"><option value="">Todos</option>${inspectors.map(n=>`<option value="${n.replace(/"/g,"&quot;")}">${n}</option>`).join("")}</select></label>
        <label><span>Comercio / inspeccionado</span><input id="ifCommerce" placeholder="Buscar por nombre o dirección"></label>
        <label><span>Desde</span><input id="ifFrom" type="date"></label>
        <label><span>Hasta</span><input id="ifTo" type="date"></label>
        <button type="button" id="ifClear">Limpiar filtros</button>
      </div>
      <div class="inspection-filter-summary-overlay" id="ifSummary"></div>
      <div class="inspection-no-results-overlay" id="ifEmpty" hidden>No hay inspecciones que coincidan con esos filtros.</div>
    `;
    panel.insertBefore(box, panel.firstChild);

    const q=id=>box.querySelector("#"+id);
    const apply=()=>{
      const inspector=q("ifInspector").value;
      const search=normalize(q("ifCommerce").value);
      const from=q("ifFrom").value;
      const to=q("ifTo").value;
      let visible=0;
      rows.forEach(r=>{
        const commerce=normalize(r.cells?.[1]?.textContent||"");
        const insp=(r.cells?.[2]?.textContent||"").trim();
        const day=rowDay(r);
        const ok=(!inspector||insp===inspector)&&(!search||commerce.includes(search))&&(!from||day>=from)&&(!to||day<=to);
        r.style.display=ok?"":"none";
        if(ok)visible++;
      });
      q("ifSummary").textContent=`Mostrando ${visible} de ${rows.length} inspección${rows.length===1?"":"es"}`;
      q("ifEmpty").hidden=visible!==0;
    };
    ["ifInspector","ifCommerce","ifFrom","ifTo"].forEach(id=>{
      q(id).addEventListener("input",apply);
      q(id).addEventListener("change",apply);
    });
    q("ifClear").addEventListener("click",()=>{
      ["ifInspector","ifCommerce","ifFrom","ifTo"].forEach(id=>q(id).value="");
      apply();
    });
    apply();
  }

  new MutationObserver(()=>enhance()).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enhance);else enhance();
})();

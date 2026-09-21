(() => {
  let chosenRole = "";

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  function roleLabel(role){
    return role === "Administrador" ? "Administrador" : "Inspector";
  }

  function resetRole(){
    chosenRole = "";
    applyRoleFlow();
  }

  function showCredentials(card, role){
    chosenRole = role;
    card.classList.add("sima-role-first","sima-role-selected");

    const title = $("h2", card);
    const sub = $(".sub", card);
    const form = $("#loginForm", card);
    const quick = $(".quick-access-title", card);
    const roles = $(".role-cards", card);
    const help = $(".help.centered", card);

    if (title) title.textContent = "Modo " + roleLabel(role);
    if (sub) sub.textContent = "Ingresá tu correo electrónico y contraseña para continuar.";
    if (quick) quick.hidden = true;
    if (roles) roles.hidden = true;
    if (help) help.hidden = true;
    if (form) form.hidden = false;

    let mode = $(".sima-selected-mode", card);
    if (!mode){
      mode = document.createElement("div");
      mode.className = "sima-selected-mode";
      mode.innerHTML =
        '<div class="sima-mode-chip"></div>' +
        '<button type="button" class="sima-change-role">← Cambiar tipo de acceso</button>';
      form?.insertAdjacentElement("beforebegin", mode);
      $(".sima-change-role", mode)?.addEventListener("click", resetRole);
    }
    const chip = $(".sima-mode-chip", mode);
    if (chip){
      chip.innerHTML = (role === "Administrador" ? "👥" : "👷") +
        " <b>" + roleLabel(role) + "</b>";
    }

    const email = $("#email", card);
    setTimeout(() => email?.focus(), 60);
  }

  function showRolePicker(card){
    card.classList.add("sima-role-first");
    card.classList.remove("sima-role-selected");

    const title = $("h2", card);
    const sub = $(".sub", card);
    const form = $("#loginForm", card);
    const quick = $(".quick-access-title", card);
    const roles = $(".role-cards", card);
    const help = $(".help.centered", card);
    const mode = $(".sima-selected-mode", card);

    if (title) title.textContent = "Elegí tu modo de acceso";
    if (sub) sub.textContent = "Seleccioná el perfil con el que vas a ingresar.";
    if (form) form.hidden = true;
    if (quick){
      quick.hidden = false;
      const b = $("b", quick);
      if (b) b.textContent = "seleccionar perfil";
    }
    if (roles) roles.hidden = false;
    if (help){
      help.hidden = false;
      help.textContent = "Después de elegir el perfil te pediremos correo electrónico y contraseña.";
    }
    if (mode) mode.remove();

    const admin = $('[data-rolehint="Administrador"]', card);
    const inspector = $('[data-rolehint="Inspector"]', card);
    if (admin){
      $("strong", admin).textContent = "Administrador";
      $("small", admin).textContent = "Gestión completa";
    }
    if (inspector){
      $("strong", inspector).textContent = "Inspector";
      $("small", inspector).textContent = "Realizar inspecciones";
    }

    $$("[data-rolehint]", card).forEach(btn => {
      if (btn.dataset.simaRoleBound === "1") return;
      btn.dataset.simaRoleBound = "1";
      btn.addEventListener("click", () => {
        const role = btn.dataset.rolehint || "";
        showCredentials(card, role);
      });
    });
  }

  function hideRemovedAdminModules(){
    const shell = $(".app-shell");
    if (!shell) return;

    $('[data-route="contribuyentes"],[data-route="infracciones"],[data-jump="contribuyentes"],[data-jump="infracciones"]').forEach(el => el.remove());

    $(".metric-card").forEach(el => {
      const t = (el.textContent || "").toLowerCase();
      if (t.includes("contribuyentes") || t.includes("infracciones")) el.remove();
    });

    const note = $(".export-note");
    if (note && /contribuyentes|infracciones/i.test(note.textContent || "")){
      note.innerHTML = "<b>Excel de presentación:</b> incluye indicadores, gráficos, datos de inspecciones, comercios, obras, inspectores y seguimiento de planillas en hojas separadas.";
    }

    if ($(".route-contribuyentes") || $(".route-infracciones")){
      $('[data-route="dashboard"]')?.click();
    }
  }

  function applyRoleFlow(){
    hideRemovedAdminModules();

    const card = $(".login-card");
    const form = card ? $("#loginForm", card) : null;

    if (!card || !form){
      if ($(".app-shell")) chosenRole = "";
      return;
    }

    if (chosenRole) showCredentials(card, chosenRole);
    else showRolePicker(card);
  }

  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(applyRoleFlow, 35);
  }).observe(document.documentElement, {subtree:true, childList:true});

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", applyRoleFlow);
  } else {
    applyRoleFlow();
  }
})();
"use strict";
// V44 · Inicializa la web sin mezclar el contenido autogestionado con posts.js.
// assets/cms-posts.json se crea al hacer la primera publicación desde /admin/.
(() => {
  async function loadSite() {
    window.TECNOLOGIA_MENU = window.TI_MENU.normalize(window.TI_MENU.defaults);
    try {
      const menuResponse = await fetch("./assets/cms-menu.json", {cache:"no-store"});
      if(menuResponse.ok) window.TECNOLOGIA_MENU = window.TI_MENU.normalize(await menuResponse.json());
    } catch (err) { console.warn("TecnologíaInsti: usando el menú predeterminado.",err); }
    const legacy = Array.isArray(window.TECNOLOGIA_POSTS) ? window.TECNOLOGIA_POSTS : [];
    try {
      const response = await fetch("./assets/cms-posts.json", {cache: "no-store"});
      if (response.ok) {
        const cms = await response.json();
        const excluded = new Set(Array.isArray(cms.hiddenIds) ? cms.hiddenIds : []);
        const merged = new Map();
        for (const post of legacy) if (!excluded.has(post.id)) merged.set(post.id,post);
        for (const post of (Array.isArray(cms.posts) ? cms.posts : [])) {
          if(post && post.id && !excluded.has(post.id)) merged.set(post.id,post);
        }
        window.TECNOLOGIA_POSTS = [...merged.values()]
          .sort((a,b) => String(b.created||"").localeCompare(String(a.created||"")));
      }
    } catch (err) {
      console.warn("TecnologíaInsti: no se pudo cargar el contenido añadido desde el panel.",err);
    }
    // Los vídeos de IA y Séneca se integran en el tablón sin reescribir posts.js
    // ni los JSON que sincroniza GitHub Actions.
    try {
      const videoPosts = await window.TI_NEWS.load();
      const byId = new Map((window.TECNOLOGIA_POSTS || []).map(p => [p.id,p]));
      for (const video of videoPosts) byId.set(video.id, video);
      window.TECNOLOGIA_POSTS = [...byId.values()];
    } catch (err) { console.warn("No se pudieron añadir los videotutoriales al tablón:",err); }
    const app = document.createElement("script");
    app.src = "./assets/app.js?v=51";
    app.onerror = () => { const node=document.getElementById("root"); if(node)node.textContent="No se pudo cargar la web. Actualiza la página para intentarlo de nuevo."; };
    document.body.appendChild(app);
  }
  loadSite();
})();

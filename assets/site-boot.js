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
    window.TI_SITE = {hero:{kicker:"EL ESPACIO DE @TECNOLOGIAINSTI",line1:"Del feed",line2:"a tu ",accent:"aula.",description:"Ideas, proyectos y herramientas para enseñar Tecnología y hacer más fácil tu día a día como docente.",primaryText:"Ver novedades",secondaryText:"Nos vemos en Instagram",secondaryUrl:"https://www.instagram.com/tecnologiainsti/",image:""},areasOrder:["Inteligencia Artificial","Proyectos","Herramientas docentes"]};
    try {
      const response=await fetch("./assets/cms-site.json",{cache:"no-store"});
      if(response.ok){const saved=await response.json();
        if(saved && saved.hero && typeof saved.hero==="object"){
          const safe={...window.TI_SITE.hero};
          for(const key of ["kicker","line1","line2","accent","description","primaryText","secondaryText","secondaryUrl"]){
            if(typeof saved.hero[key]==="string"&& (key!=="secondaryUrl"||/^https:\/\/[^\s<>"']+$/i.test(saved.hero[key])))safe[key]=saved.hero[key].slice(0,500);
          }
          if(typeof saved.hero.image==="string"&&/^assets\/[a-z0-9_./-]+\.(?:webp|png|jpg|jpeg)$/i.test(saved.hero.image)&&!saved.hero.image.includes(".."))safe.image=saved.hero.image;
          window.TI_SITE.hero=safe;
        }
        if(Array.isArray(saved?.areasOrder))window.TI_SITE.areasOrder=saved.areasOrder.filter(x=>window.TI_SITE.areasOrder.includes(x));
      }
    } catch(err){console.warn("Configuración de portada predeterminada.",err);}
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
    // Un post programado permanece oculto hasta la fecha indicada. El JSON público
    // no constituye un almacén privado de borradores.
    window.TECNOLOGIA_POSTS=(window.TECNOLOGIA_POSTS||[]).filter(p=>window.TI_VISIBILITY.visible(p));
    // Los vídeos de IA y Séneca se integran en el tablón sin reescribir posts.js
    // ni los JSON que sincroniza GitHub Actions.
    try {
      const videoPosts = await window.TI_NEWS.load();
      const byId = new Map((window.TECNOLOGIA_POSTS || []).map(p => [p.id,p]));
      for (const video of videoPosts) byId.set(video.id, video);
      window.TECNOLOGIA_POSTS = [...byId.values()];
    } catch (err) { console.warn("No se pudieron añadir los videotutoriales al tablón:",err); }
    const app = document.createElement("script");
    app.src = "./assets/app.js?v=54";
    app.onerror = () => { const node=document.getElementById("root"); if(node)node.textContent="No se pudo cargar la web. Actualiza la página para intentarlo de nuevo."; };
    document.body.appendChild(app);
  }
  loadSite();
})();

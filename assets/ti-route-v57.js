"use strict";
/* TecnologíaInsti V57 · Direcciones individuales en el tablón (History API).
 * Se respeta la antigua ruta publicacion.html?id=... de la V56.
 * No se utiliza almacenamiento ni se modifican publicaciones.
 */
(() => {
  const PARAM = "post";
  const MARKER = "__tecnologiaInstiPostV57";
  const param = () => new URLSearchParams(window.location.search).get(PARAM) || "";
    function routeTo(post) {
    const id = post && post.id != null ? String(post.id) : "";
    if (id && (id.length > 180 || /[\x00-\x1f]/.test(id))) return;
    if (id === param()) return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set(PARAM, id);
      // El historial permite que Atrás cierre y Adelante reabra el recurso.
      const old = window.history.state;
      const state = old && typeof old === "object" && !Array.isArray(old) ? {...old} : {};
      state[MARKER] = true;
      window.history.pushState(state, "", url.href);
    } else {
      url.searchParams.delete(PARAM);
      const state = window.history.state;
      if (state && state[MARKER] === true) {
        window.history.back();
      } else {
        // Si el visitante abrió directamente ?post=..., cerrar NO le lleva
        // a una web anterior: limpia solamente la dirección actual.
        window.history.replaceState(state, "", url.href);
      }
    }
  }
  function bind(setPost, posts) {
    function sync() {
      const id = param();
      if (!id) { setPost(null); return; }
      const post = (posts || []).find(p => p && String(p.id) === id && p.published);
      if (post) setPost(post);
      else if ((posts || []).length) setPost(null);
    }
    window.addEventListener("popstate", sync);
    sync();
    return () => window.removeEventListener("popstate", sync);
  }
  function permalink(post) {
    const id = post && typeof post === "object" ? post.id : post;
    const script = document.querySelector('script[src*="ti-route-v57.js"]');
    const root = script ? new URL("../", script.src) : new URL("./", document.baseURI);
    const url = new URL(root.href);
    url.searchParams.set(PARAM, String(id ?? ""));
    return url.href;
  }
  function legacyPermalink(post) {
    const id = post && typeof post === "object" ? post.id : post;
    const script = document.querySelector('script[src*="ti-route-v57.js"]');
    const root = script ? new URL("../", script.src) : new URL("./", document.baseURI);
    const url = new URL("publicacion.html",root);
    url.searchParams.set("id",String(id ?? ""));
    return url.href;
  }
  window.TI_V57 = Object.freeze({param,routeTo,bind,permalink,legacyPermalink});
})();

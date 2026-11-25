"use strict";
/* V59 · Crear sitemap.xml al guardar publicaciones desde /admin/.
 * El CMS y el sitemap se guardan en UN SOLO commit con el token del usuario;
 * así GitHub Pages puede desplegar el XML junto al contenido.
 */
(() => {
  const BASE="https://tecnologiapuntes.github.io/tecno/";
  const DEFAULT_PAGES=["index.html","cuaderno-seneca.html","videotutoriales-ia.html"];
  const forbidden=new Set(["admin","assets","scripts",".github","node_modules"]);
  const escapeXml=text=>String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  const isVisible=(p,now=Date.now())=>{
    if(!p || !p.published)return false;
    const t=Date.parse(String(p.publishAt||""));
    return !Number.isFinite(t) || t<=now;
  };
  const pageUrl=path=>{
    if(typeof path!=="string" || !path.endsWith(".html"))return "";
    if(path.includes("..")||path.split("/").some(part=>forbidden.has(part)))return "";
    const name=path.split("/").pop().toLowerCase();
    if(name==="publicar.html"||name==="404.html"||name.startsWith("google")||path==="publicacion.html")return "";
    if(path==="index.html")return BASE;
    const segment=path.endsWith("/index.html")?path.slice(0,-10):path;
    return BASE+segment.split("/").map(encodeURIComponent).join("/");
  };
  function build(legacy,cms,paths=DEFAULT_PAGES,at=Date.now()){
    const doc=cms&&typeof cms==="object"?cms:{};
    const hidden=new Set(Array.isArray(doc.hiddenIds)?doc.hiddenIds.map(String):[]);
    const items=new Map();
    for(const p of Array.isArray(legacy)?legacy:[]){if(p?.id)items.set(String(p.id),p);}
    for(const p of Array.isArray(doc.posts)?doc.posts:[]){if(p?.id)items.set(String(p.id),p);}
    const urls=new Set(DEFAULT_PAGES.map(pageUrl).filter(Boolean));
    for(const path of paths||[]) {const url=pageUrl(path);if(url)urls.add(url);}
    for(const [id,post] of items){
      if(hidden.has(id)||id.length>180||/[\x00-\x1f]/.test(id)||!isVisible(post,at))continue;
      urls.add(BASE+"?post="+encodeURIComponent(id));
    }
    const sorted=[...urls].sort();
    return "<?xml version='1.0' encoding='utf-8'?>\n"+
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
      sorted.map(url=>'  <url>\n    <loc>'+escapeXml(url)+'</loc>\n  </url>').join('\n')+
      '\n</urlset>\n';
  }
  window.TI_SITEMAP_V59=Object.freeze({build,isVisible,pageUrl});
})();

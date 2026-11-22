"use strict";
/* V56 · Un enlace estable para cada publicación: ?id=... */
(() => {
  const root=document.getElementById("detailRoot");
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function safeMedia(value){
    const s=String(value||"").trim();
    if(/^https:\/\/[^\s<>"']+$/i.test(s))return s;
    if(/^assets\/[\w./-]+$/i.test(s)&&!s.includes(".."))return s;
    return "";
  }
  function link(value){
    const s=String(value||"").trim();
    if(/^https?:\/\/[^\s<>"']+$/i.test(s))return s;
    if(/^(?:assets|descargas)\/[\w./-]+$/i.test(s)&&!s.includes(".."))return s;
    return "";
  }
  function failure(title,description){
    document.title=title+" · TecnologíaInsti";
    root.innerHTML=`<section class="detail-card detail-empty"><h1>${esc(title)}</h1><p>${esc(description)}</p><a class="detail-button" href="./#publicaciones">Explorar novedades</a></section>`;
  }
  async function load(){
    const id=new URLSearchParams(location.search).get("id");
    if(!id||id.length>180){failure("Publicación no encontrada","El enlace no contiene un identificador válido.");return;}
    const all=new Map();
    for(const post of (Array.isArray(window.TECNOLOGIA_POSTS)?window.TECNOLOGIA_POSTS:[]))if(post?.id)all.set(String(post.id),post);
    try{
      const response=await fetch("./assets/cms-posts.json",{cache:"no-store"});
      if(response.ok){const cms=await response.json();const hidden=new Set(cms.hiddenIds||[]);
        for(const post of (cms.posts||[]))if(post?.id)all.set(String(post.id),post);
        for(const excluded of hidden)all.delete(String(excluded));
      }
    }catch(e){console.warn("No se pudo consultar el contenido administrado",e);}
    try{for(const video of await window.TI_NEWS.load())if(video?.id)all.set(String(video.id),video);}catch(e){console.warn("No se pudieron cargar vídeos",e);}
    const post=all.get(id);
    if(!post||!window.TI_VISIBILITY.visible(post)){
      failure("Publicación no disponible","No se ha encontrado este recurso o todavía no está publicado.");return;
    }
    document.title=post.title+" · TecnologíaInsti";
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=String(post.excerpt||"").slice(0,160);
    const date=post.created&&/^\d{4}-\d{2}-\d{2}$/.test(post.created)?new Date(post.created+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}):"Fecha pendiente";
    const gallery=(post.images?.length?post.images:(post.image?[post.image]:[])).map(safeMedia).filter(Boolean);
    const links=(post.sourceLinks||[]).filter(item=>link(item.url));
    const image=gallery[0]||"";
    const embed=post.youtubeId&&/^[A-Za-z0-9_-]{11}$/.test(post.youtubeId)?`<iframe src="https://www.youtube-nocookie.com/embed/${esc(post.youtubeId)}" title="Videotutorial" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`:"";
    root.innerHTML=`<article class="detail-card">
      <div class="detail-meta"><span class="detail-chip">${esc(post.category||"Recursos")}</span><time>${esc(date)}</time>${post.kind==="video"?'<span>▶ Videotutorial</span>':''}</div>
      <h1>${esc(post.title)}</h1>${post.excerpt?`<p class="detail-lead">${esc(post.excerpt)}</p>`:""}
      ${embed?`<div class="detail-video">${embed}</div>`:post.video&&safeMedia(post.video)?`<video class="detail-hero-image" controls playsinline src="${esc(safeMedia(post.video))}"></video>`:image?`<img class="detail-hero-image" src="${esc(image)}" alt="Portada de ${esc(post.title)}" loading="eager">`:""}
      <div class="detail-body">${window.TI_POST_FORMAT.format(post.content||"")}</div>
      ${gallery.length>1?`<section class="detail-section"><h2>Carrusel de imágenes</h2><div class="detail-gallery">${gallery.map((src,i)=>`<a href="${esc(src)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen ${i+1}"><img loading="lazy" src="${esc(src)}" alt="Lámina ${i+1}"></a>`).join("")}</div></section>`:""}
      ${links.length||post.attachment?`<section class="detail-section"><h2>Enlaces y materiales</h2><div class="detail-resources">${links.map(item=>`<a href="${esc(link(item.url))}" target="_blank" rel="noopener noreferrer">${esc(item.label||"Abrir recurso")} ↗</a>`).join("")}${post.attachment&&link(post.attachment)&&!links.some(item=>item.url===post.attachment)?`<a href="${esc(link(post.attachment))}">${esc(post.attachmentName||"Descargar recurso")}</a>`:""}</div></section>`:""}
      <div class="detail-bottom"><button class="detail-button" id="detailShare">Compartir enlace</button><button class="detail-button outline" id="detailCopy">Copiar dirección</button><a href="./#publicaciones">← Volver a novedades</a></div>
    </article>`;
    document.getElementById("detailShare").addEventListener("click",async()=>{const ok=await window.TI_V56.share(post);if(ok)document.getElementById("detailShare").textContent="Enlace listo para compartir ✓";});
    document.getElementById("detailCopy").addEventListener("click",async()=>{
      const url=window.TI_V56.permalink(post);
      try{await navigator.clipboard.writeText(url);document.getElementById("detailCopy").textContent="¡Copiado!";}catch{window.prompt("Copia este enlace:",url);}
    });
  }
  load().catch(err=>{console.error(err);failure("No se pudo cargar la publicación","Actualiza la página o vuelve a intentarlo más tarde.");});
})();

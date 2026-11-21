"use strict";
// V50 · Publicaciones creadas desde el panel que pertenecen a una página propia
// (Videotutoriales IA o Cuaderno de Séneca). No cambia el reproductor de vídeos.
(() => {
  const host = document.getElementById('cms-page-posts');
  if (!host) return;
  const category = host.dataset.category;
  const type = (s) => String(s ?? '');
  const el = (tag, cls='', content) => {
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(content!==undefined)node.textContent=type(content);
    return node;
  };
  const validAsset = (p) => /^assets\/[a-zA-Z0-9_./-]+$/.test(p) && !p.includes('..');
  const validUrl = (p) => /^https:\/\/[^\s<>"']+$/i.test(p);
  function fileHref(path){
    if(validAsset(path))return './'+path;
    if(validUrl(path))return path;
    return null;
  }
  let current=null, activePhoto=0;
  let originalOverflow='';
  const overlay=el('div','post-page-overlay');
  overlay.setAttribute('role','presentation');
  overlay.hidden=true;
  const modal=el('section','post-page-modal');
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','Publicación');
  const bar=el('div','post-page-modal-bar');
  const heading=el('h2','','');const closeButton=el('button','post-page-close','×');
  closeButton.type='button';closeButton.setAttribute('aria-label','Cerrar publicación');
  bar.append(heading,closeButton);
  const body=el('div','post-page-modal-body');
  modal.append(bar,body);overlay.append(modal);document.body.append(overlay);
  function close(){
    if(overlay.hidden)return;
    overlay.hidden=true;body.replaceChildren();document.body.style.overflow=originalOverflow;
    current=null;
  }
  closeButton.addEventListener('click',close);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
  function show(post){
    current=post;activePhoto=0;heading.textContent=post.title;
    body.replaceChildren();
    const imgs=(Array.isArray(post.images)&&post.images.length?post.images:(post.image?[post.image]:[]))
      .map(fileHref).filter(Boolean);
    if(imgs.length){
      const gallery=el('div','post-page-gallery');
      const main=el('img','post-page-image');main.alt=post.title;gallery.append(main);
      const controls=el('div','post-page-gallery-controls');
      const prev=el('button','','←');prev.type='button';prev.setAttribute('aria-label','Imagen anterior');
      const indicator=el('span','','');
      const next=el('button','','→');next.type='button';next.setAttribute('aria-label','Imagen siguiente');
      function update(){main.src=imgs[activePhoto];indicator.textContent=`${activePhoto+1} / ${imgs.length}`;prev.disabled=activePhoto===0;next.disabled=activePhoto===imgs.length-1;}
      prev.addEventListener('click',()=>{if(activePhoto>0){activePhoto--;update();}});
      next.addEventListener('click',()=>{if(activePhoto<imgs.length-1){activePhoto++;update();}});
      controls.append(prev,indicator,next);gallery.append(controls);body.append(gallery);update();
    }
    body.append(el('p','post-page-date',post.created||''));
    const text=el('div','post-page-content');text.innerHTML=window.TI_POST_FORMAT.format(post.content||post.excerpt||'');body.append(text);
    if(Array.isArray(post.sourceLinks))for(const link of post.sourceLinks){
      const href=fileHref(link.url||'');if(!href)continue;
      const a=el('a','post-page-download',link.label||'Abrir recurso');a.href=href;a.target='_blank';a.rel='noopener noreferrer';
      body.append(a);
    }
    if(post.attachment){const href=fileHref(post.attachment);if(href){const a=el('a','post-page-download',post.attachmentName||'Descargar documento');a.href=href;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}}
    overlay.hidden=false;originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';closeButton.focus();
  }
  function render(posts){
    const available=posts.filter(p=>p&&window.TI_VISIBILITY.visible(p)&&p.category===category)
      .sort((a,b)=>type(b.created).localeCompare(type(a.created)));
    if(!available.length){host.hidden=true;return;}
    const header=el('div','post-page-header');
    header.append(el('div','post-page-tag','RECURSOS DEL AULA'),el('h2','',category==='Videotutoriales IA'?'Más recursos de inteligencia artificial':'Más recursos de Cuaderno de Séneca'));
    const grid=el('div','post-page-grid');
    for(const p of available){
      const card=el('button','post-page-card');card.type='button';
      if(fileHref(p.image)){const img=el('img','');img.src=fileHref(p.image);img.alt='';img.loading='lazy';card.append(img)}
      const wrap=el('div','post-page-card-copy');wrap.append(el('small','',p.created||''),el('h3','',p.title),el('p','',p.excerpt||''),el('span','','Ver publicación ›'));card.append(wrap);
      card.addEventListener('click',()=>show(p));grid.append(card);
    }
    host.replaceChildren(header,grid);host.hidden=false;
  }
  async function load(){
    try{
      const [legacyResponse,cmsResponse]=await Promise.all([
        fetch('./assets/posts.js?v=43',{cache:'no-store'}),
        fetch('./assets/cms-posts.json',{cache:'no-store'})
      ]);
      let legacy=[];
      if(legacyResponse.ok){
        const text=await legacyResponse.text();
        legacy=JSON.parse(text.replace(/^\s*window\.TECNOLOGIA_POSTS\s*=\s*/, '').trim().replace(/;\s*$/,''));
      }
      let cms={posts:[],hiddenIds:[]};
      if(cmsResponse.ok)cms=await cmsResponse.json();
      const hidden=new Set(Array.isArray(cms.hiddenIds)?cms.hiddenIds:[]);
      const all=new Map();
      for(const p of (Array.isArray(legacy)?legacy:[]))if(p?.id&&!hidden.has(p.id))all.set(p.id,p);
      for(const p of (Array.isArray(cms.posts)?cms.posts:[]))if(p?.id&&!hidden.has(p.id))all.set(p.id,p);
      render([...all.values()]);
    }catch(error){console.warn('No se pudieron cargar las publicaciones de esta página.',error)}
  }
  load();
})();

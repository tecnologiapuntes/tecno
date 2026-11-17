(() => {
  'use strict';
  const PLAYLIST = 'PL4P4xfIXfbrF57UhR4Y_El-mdtnddYcyn';
  const index = document.querySelector('#video-index');
  const cards = document.querySelector('#video-cards');
  const status = document.querySelector('#video-count');
  const fallback = document.querySelector('#seneca-fallback');
  const section = document.querySelector('#seneca-video-section');
  const search = document.querySelector('#search');
  const modal = document.querySelector('#modal');
  const description = document.querySelector('#modal-descr');
  const player = document.querySelector('#video-player');
  const prev = document.querySelector('#prev');
  const next = document.querySelector('#next');
  let videos = [], filtered = [], active = -1, partial = false;
  const pad = n => String(n).padStart(2,'0');
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const validVideo = v => v && /^[\w-]{11}$/.test(v.id) && typeof v.title==='string' && v.title.trim();
  const original = v => 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '&list=' + PLAYLIST;
  const thumb = v => /^https:\/\//.test(v.thumbnail||'') ? v.thumbnail : 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';

  // Translation of titles shown on the site. Keep v.title unchanged so
  // syncing GitHub Actions can update the original YouTube metadata safely.
  // Rules are matched by subject, not by position: adding/reordering videos
  // cannot assign an incorrect translation to another video.
  const titleRulesEs = [
    [/\bgetting started\b|\bsetup\b/i, 'Primeros pasos y configuración del Cuaderno de Séneca LOMLOE'],
    [/\bevaluable activities without creating\b/i, 'Actividades evaluables sin crear una situación de aprendizaje (SdA)'],
    [/\bcreation of learning situations\b/i, 'Creación de situaciones de aprendizaje (SdA)'],
    [/\b(?:assessable|evaluable) activities from the learning standards\b/i, 'Actividades evaluables a partir de los estándares de aprendizaje'],
    [/\bassess criteria without using\b/i, 'Evaluación de criterios sin utilizar el cuaderno'],
    [/\bexporting grades from moodle\b/i, 'Exportar calificaciones de Moodle a Séneca'],
    [/\bgrading the quarter\b/i, 'Calificación del trimestre'],
    [/\bcloning assessable activities\b/i, 'Clonar actividades evaluables · Importante: leer la descripción'],
    [/\brecovering activities\b/i, 'Recuperar actividades y solucionar problemas con datos perdidos'],
    [/\beasy seneca extension\b|\bmass grading criteria\b/i, 'Extensión Easy Séneca · Calificación masiva de criterios']
  ];
  function displayTitle(v) {
    const source = String(v.title || '').trim();
    if (typeof v.title_es === 'string' && v.title_es.trim()) return v.title_es.trim();
    const rule = titleRulesEs.find(([pattern]) => pattern.test(source));
    if (rule) return rule[1];
    // Existing original titles in Spanish should remain intact.
    return source.replace(/\s*[📱📕📗📘📙📲]+\s*$/gu,'').trim();
  }

  function indexCard(v, n) {
    const button = el('button','index-item'); button.type='button'; button.dataset.id=v.id;
    button.setAttribute('aria-label','Abrir ' + displayTitle(v));
    if(displayTitle(v)!==v.title) button.title='Título original: '+v.title;
    button.append(el('span','index-num',pad(n+1)));
    const content=el('span','index-copy');
    content.append(el('span','index-title',displayTitle(v)),el('small','','Videotutorial · Cuaderno de Séneca'));
    button.append(content,el('span','arrow','›'));
    button.addEventListener('click',()=>show(v.id));
    return button;
  }
  function videoCard(v, n) {
    const button=el('button','video-card'); button.type='button';button.dataset.id=v.id;
    button.setAttribute('aria-label','Ver vídeo: '+displayTitle(v));
    if(displayTitle(v)!==v.title) button.title='Título original: '+v.title;
    const image=el('div','video-thumb');const img=el('img');img.src=thumb(v);
    img.alt='Miniatura original del vídeo: '+v.title;img.loading='lazy';
    img.onerror=()=>{img.onerror=null;img.src='https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg'};
    image.append(img,el('span','big-play','▶'));
    const info=el('div','video-info');info.append(el('span','video-num','VÍDEO '+pad(n+1)));
    info.append(el('h3','',displayTitle(v)),el('p','',v.description ? v.description.slice(0,170).replace(/\s+/g,' ') + (v.description.length>170?'…':'') : 'Ver el videotutorial y consultar los detalles disponibles en YouTube.'));
    info.append(el('span','video-open','Ver vídeo y descripción ↗'));
    button.append(image,info);button.addEventListener('click',()=>show(v.id));return button;
  }
  function render(){
    search.closest('.searchbox').hidden=!videos.length;
    const q=search.value.trim().toLocaleLowerCase('es');
    filtered=videos.filter(v=>(displayTitle(v)+' '+v.title+' '+(v.description||'')).toLocaleLowerCase('es').includes(q));
    index.replaceChildren(...filtered.map(v=>indexCard(v,videos.indexOf(v))));
    cards.replaceChildren(...filtered.map(v=>videoCard(v,videos.indexOf(v))));
    if(videos.length){
      status.textContent=(filtered.length===videos.length?videos.length+' vídeos':filtered.length+' de '+videos.length+' vídeos')+(partial?' · lista parcial':'');
      fallback.hidden=true;section.hidden=filtered.length===0;
      index.hidden=filtered.length===0;
      if(filtered.length===0){index.parentElement.style.display='block';status.textContent='Sin coincidencias'}
      else index.parentElement.style.display='';
    }else{status.textContent='Lista original de YouTube';fallback.hidden=false;section.hidden=true;index.parentElement.style.display='none'}
  }
  function linkify(text, parent){
    // Convert only http(s) links, leave descriptions as plain text; no HTML injection.
    const regex=/https?:\/\/[^\s<>]+/g;let match,pos=0;
    while((match=regex.exec(text))){parent.append(document.createTextNode(text.slice(pos,match.index)));
      const a=el('a','',match[0]);a.href=match[0];a.target='_blank';a.rel='noopener noreferrer';parent.append(a);pos=match.index+match[0].length}
    parent.append(document.createTextNode(text.slice(pos)));
  }
  function show(id){
    active=videos.findIndex(v=>v.id===id);if(active===-1)return;
    const v=videos[active];document.querySelector('#modal-title').textContent=pad(active+1)+' · '+displayTitle(v);
    player.replaceChildren();const frame=el('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v.id)+'?rel=0';
    frame.title='Reproducir '+displayTitle(v);frame.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.setAttribute('allowfullscreen','');
    player.append(frame);
    description.replaceChildren();linkify(v.description || 'Este vídeo no tiene una descripción disponible en los datos recuperados de YouTube.',description);
    document.querySelector('#youtube-video-link').href=original(v);
    prev.disabled=active===0;next.disabled=active===videos.length-1;
    modal.classList.add('open');document.body.style.overflow='hidden';document.querySelector('#close-modal').focus();
    history.replaceState(null,'','#video-'+v.id);
  }
  function close(){modal.classList.remove('open');document.body.style.overflow='';player.replaceChildren();history.replaceState(null,'',location.pathname)}
  document.querySelector('#close-modal').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});
  prev.addEventListener('click',()=>{if(active>0)show(videos[active-1].id)});
  next.addEventListener('click',()=>{if(active<videos.length-1)show(videos[active+1].id)});
  search.addEventListener('input',render);
  const toggle=document.querySelector('#seneca-menu-toggle'),panel=document.querySelector('#seneca-main-menu');
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))});
  document.addEventListener('click',e=>{if(!panel.hidden&&!e.target.closest('.navbar')){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}});
  async function load(){
    try{
      const res=await fetch('./assets/seneca-videos.json',{cache:'no-store'});
      if(!res.ok)throw Error('Archivo no disponible');
      const data=await res.json();
      videos=(Array.isArray(data.videos)?data.videos:[]).filter(validVideo);
      partial=String(data.source||'').startsWith('RSS parcial');
      // Dataset order is exactly the YouTube playlist order.
      render();
      const match=location.hash.match(/^#video-([\w-]{11})$/);if(match)show(match[1]);
    }catch(err){console.warn('La lista individual aún no se ha sincronizado:',err);videos=[];render()}
  }
  load();
})();

(() => {
  'use strict';
  const PLAYLIST='PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj';
  const cards=document.querySelector('#video-cards');
  const status=document.querySelector('#video-count');
  const fallback=document.querySelector('#ia-fallback');
  const section=document.querySelector('#ia-video-section');
  const search=document.querySelector('#search');
  const modal=document.querySelector('#modal');
  const description=document.querySelector('#modal-descr');
  const player=document.querySelector('#video-player');
  const prev=document.querySelector('#prev');
  const next=document.querySelector('#next');
  let videos=[],filtered=[],active=-1,partial=false;
  const pad=n=>String(n).padStart(2,'0');
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  const isVideo=v=>v&&/^[\w-]{11}$/.test(v.id)&&typeof v.title==='string'&&v.title.trim();
  const original=v=>'https://www.youtube.com/watch?v='+encodeURIComponent(v.id)+'&list='+PLAYLIST;
  const thumb=v=>/^https:\/\//.test(v.thumbnail||'')?v.thumbnail:'https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg';


  // La traducción se guarda por ID en GitHub Actions. La ficha pública nunca
  // expone accidentalmente metadatos ingleses mientras se termina el proceso.
  const spanishWords=/(?:\b(?:el|la|los|las|una|uno|del|para|con|sin|cómo|qué|tus|mis|sus|este|esta|esto|aprende|profes|profesorado|alumnado|clase|aula|enseñanza|educación|herramienta|guía|crea|gratis|infografías|inteligencia|artificial|mejores|trucos|vídeo|tutoriales|novedades|edita|editarla|secreto|solución|utilizar|usar)\b|[áéíóúñ¿¡])/i;
  const englishWords=/(?:\b(?:how to|the best|this video|this tutorial|in this|you can|you will|learn how|for teachers|step by step|the new|what is|how do|getting started|tips for|video tutorial|your classroom|with these|for your|using ai|top tips|subscribe to|check out|watch this|download the|tutorial on)\b)/i;
  function safeSpanish(source){
    const t=String(source||'').trim();
    return !!t && spanishWords.test(t) && !englishWords.test(t);
  }
  function title(v,n){
    const translated=String(v.title_es||'').trim();
    if(translated && !englishWords.test(translated) && (safeSpanish(translated)||v.title_es_verified===true))return translated;
    const source=String(v.title||'').trim();
    if(safeSpanish(source))return source;
    return 'Videotutorial de inteligencia artificial · '+pad(n+1)+' (título pendiente de traducción)';
  }
  function spanishDescription(v){
    const translated=String(v.description_es||'').trim();
    if(translated && !englishWords.test(translated) && (safeSpanish(translated)||v.description_es_verified===true))return translated;
    const source=String(v.description||'').trim();
    if(safeSpanish(source))return source;
    return source
      ? 'La traducción completa de esta descripción está pendiente. Puedes consultar el texto original en YouTube.'
      : 'Este vídeo no tiene una descripción disponible. Puedes consultar sus detalles en YouTube.';
  }
  function videoCard(v,n){
    const button=el('button','video-card');button.type='button';button.dataset.id=v.id;
    button.setAttribute('aria-label','Ver vídeo: '+title(v,n));
    const image=el('div','video-thumb');const img=el('img');img.src=thumb(v);
    img.alt='Miniatura del vídeo '+pad(n+1);img.loading='lazy';
    img.onerror=()=>{img.onerror=null;img.src='https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg'};
    image.append(img,el('span','big-play','▶'));
    const info=el('div','video-info');
    info.append(el('span','video-num','VÍDEO '+pad(n+1)));
    const text=spanishDescription(v);
    info.append(el('h3','',title(v,n)),el('p','',text.length>170?text.slice(0,170).replace(/\s+\S*$/,'')+'…':text));
    info.append(el('span','video-open','Ver vídeo y descripción ›'));
    button.append(image,info);button.addEventListener('click',()=>show(v.id));return button;
  }
  function render(){
    const q=search.value.trim().toLocaleLowerCase('es');
    search.closest('.searchbox').hidden=!videos.length;
    filtered=videos.filter((v,n)=>(title(v,n)+' '+v.title+' '+spanishDescription(v)).toLocaleLowerCase('es').includes(q));
    cards.replaceChildren(...filtered.map(v=>videoCard(v,videos.indexOf(v))));
    if(videos.length){
      status.textContent=(filtered.length===videos.length?videos.length+' vídeos':filtered.length+' de '+videos.length+' vídeos')+(partial?' · lista parcial':'');
      // Mostrar exclusivamente las tarjetas, sin reproductor de lista gigante.
      fallback.hidden=true;section.hidden=false;
      if(!filtered.length)cards.append(el('p','no-results','No se encontraron vídeos con ese término.'));
    }else{
      status.textContent='Sincronización pendiente';fallback.hidden=false;section.hidden=true;
    }
  }
  function linkify(text,parent){
    const regex=/https?:\/\/[^\s<>]+/g;let match,pos=0;
    while((match=regex.exec(text))){parent.append(document.createTextNode(text.slice(pos,match.index)));
      const a=el('a','',match[0]);a.href=match[0];a.target='_blank';a.rel='noopener noreferrer';parent.append(a);pos=match.index+match[0].length;}
    parent.append(document.createTextNode(text.slice(pos)));
  }
  function show(id){
    active=videos.findIndex(v=>v.id===id);if(active===-1)return;
    const v=videos[active];document.querySelector('#modal-title').textContent=pad(active+1)+' · '+title(v,active);
    player.replaceChildren();const frame=el('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v.id)+'?rel=0';
    frame.title='Reproducir '+title(v,active);frame.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.setAttribute('allowfullscreen','');player.append(frame);
    description.replaceChildren();linkify(spanishDescription(v),description);
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

  // Navigation dropdowns: accessible on click/touch/keyboard, hover on mouse.
  const toggle=document.querySelector('#seneca-menu-toggle');
  const panel=document.querySelector('#seneca-main-menu');
  toggle.addEventListener('click',()=>{
    panel.hidden=!panel.hidden;
    toggle.setAttribute('aria-expanded',String(!panel.hidden));
  });
  document.addEventListener('click',e=>{
    if(!e.target.closest('.navbar')){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
  });
  async function mergeManual(automatic,category){
    try{
      const response=await fetch('./assets/cms-videos.json',{cache:'no-store'});
      if(!response.ok)return automatic;
      const data=await response.json();
      const map=new Map(automatic.map(v=>[v.id,v]));
      for(const v of (Array.isArray(data.videos)?data.videos:[])){
        if(v.category!==category||!/^[\w-]{11}$/.test(String(v.id||'')))continue;
        // An expressly disabled manual entry overrides the automatic one.
        if(!window.TI_VISIBILITY.videoVisible(v)){map.delete(v.id);continue;}
        map.set(v.id,{...map.get(v.id),...v,title:v.title_es||v.title,
          title_es:v.title_es||v.title,description_es:v.description_es||v.description||'',
          title_es_verified:true,description_es_verified:true,
          thumbnail:v.thumbnail||'https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg'});
      }
      return [...map.values()].filter(isVideo);
    }catch(error){console.warn('Vídeos manuales no disponibles:',error);return automatic;}
  }
  async function load(){
    let automatic=[];
    try{
      const res=await fetch('./assets/ia-videos.json?lista='+PLAYLIST+'&v=54',{cache:'no-store'});
      if(res.ok){const data=await res.json();
        if(data.playlist_id===PLAYLIST){automatic=(Array.isArray(data.videos)?data.videos:[]).filter(isVideo);partial=String(data.source||'').startsWith('RSS parcial');}
      }
    }catch(err){console.warn('YouTube IA: sincronización no disponible',err);}
    videos=await mergeManual(automatic,'Videotutoriales IA');render();
    const match=location.hash.match(/^#video-([\w-]{11})$/);if(match)show(match[1]);
  }
  render();
  load();
})();

(() => {
  'use strict';
  const PLAYLIST='PL4P4xfIXfbrF57UhR4Y_El-mdtnddYcyn';
  const cards=document.querySelector('#video-cards');
  const status=document.querySelector('#video-count');
  const fallback=document.querySelector('#seneca-fallback');
  const section=document.querySelector('#seneca-video-section');
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

  // Traducción por temas del listado real. Las traducciones generadas en GitHub
  // tienen prioridad para los vídeos nuevos. No asignamos traducciones por posición.
  const titleRulesEs=[
    [/\bgetting started\b|\bsetup\b/i,'Primeros pasos y configuración del Cuaderno de Séneca LOMLOE'],
    [/\b(?:evaluable|assessable) activities without creating\b/i,'Actividades evaluables sin crear una situación de aprendizaje (SdA)'],
    [/\bcreation of learning situations\b/i,'Creación de situaciones de aprendizaje (SdA)'],
    [/\b(?:assessable|evaluable) activities from the learning standards\b/i,'Actividades evaluables a partir de los estándares de aprendizaje'],
    [/\bassess criteria without using\b/i,'Evaluar criterios sin utilizar el cuaderno ni materiales de aprendizaje'],
    [/\bexporting grades from moodle\b/i,'Exportación de calificaciones de Moodle a Séneca'],
    [/\bgrading the quarter\b/i,'Calificación del trimestre en Séneca'],
    [/\bcloning assessable activities\b/i,'Clonación de actividades evaluables (leer la descripción)'],
    [/\brecovering activities\b|\bsolutions for missing data\b/i,'Recuperación de actividades y solución de datos desaparecidos'],
    [/\beasy seneca extension\b|\bmass grading criteria\b/i,'Extensión Easy Séneca: calificación masiva de criterios']
  ];
  const titleEnglish=/(?:\b(?:workbook|notebook|gradebook|getting|started|setup|evaluable|assessable|activities|without|creating|learning|standards|assess|grading|grades|grade|quarter|moodle|cloning|recovering|missing|data|criteria|criterion|mass|extension|description|how|what|when|why|easy|tips|tutorial|teacher|exporting|new|copying|deleting|records|reports|evaluation|configuration|setting|using|adding|adding|course|student|students|calculation|competencies|uploading|downloading|importing)\b)/i;
  const descEnglish=/(?:\b(?:you can|you will|how to|in this video|in this tutorial|the following|we show|learning standards|gradebook|this tool|evaluable activities|with the|about the|for your|from the|this video|this lesson|the video|learn how|step by step|watch the|in order to|video shows|for teachers|please subscribe|in the|of the|and the|where you|if you)\b)/i;
  function title(v,n){
    const source=String(v.title||'').trim();
    const matched=titleRulesEs.find(([re])=>re.test(source));
    if(matched) return matched[1];
    const translated=String(v.title_es||'').trim();
    if(translated&&!titleEnglish.test(translated))return translated;
    const stripped=source.replace(/^[\s\d.\-·]+/u,'').replace(/\s*[📱📕📗📘📙📲]+\s*$/gu,'').trim();
    if(!titleEnglish.test(stripped))return stripped;
    // Avoid displaying untranslated English after a new playlist sync.
    // Never invent what the video covers if the subject is unknown.
    return 'Cuaderno de Séneca · Videotutorial '+pad(n+1);
  }
  function spanishDescription(v){
    const translated=String(v.description_es||'').trim();
    if(translated&&!descEnglish.test(translated))return translated;
    const source=String(v.description||'').trim();
    if(!source)return 'La descripción de este vídeo aún no está disponible. Puedes consultar sus detalles en YouTube.';
    if(!descEnglish.test(source))return source;
    return 'La traducción de la descripción está pendiente. Puedes consultar la descripción original y los enlaces del vídeo directamente en YouTube.';
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
      fallback.hidden=true;section.hidden=false;
      if(!filtered.length)cards.append(el('p','no-results','No se encontraron vídeos con ese término.'));
    }else{
      status.textContent='Lista de YouTube';fallback.hidden=false;section.hidden=true;
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
  async function load(){
    try{
      const res=await fetch('./assets/seneca-videos.json',{cache:'no-store'});
      if(!res.ok)throw Error('Archivo no disponible');
      const data=await res.json();videos=(Array.isArray(data.videos)?data.videos:[]).filter(isVideo);
      partial=String(data.source||'').startsWith('RSS parcial');render();
      const match=location.hash.match(/^#video-([\w-]{11})$/);if(match)show(match[1]);
    }catch(err){console.warn('Vídeos no sincronizados:',err);videos=[];render()}
  }
  load();
})();

"use strict";
/* V51 · Un único tablón para publicaciones y videotutoriales.
   Las fechas de vídeos proceden de YouTube, nunca de la sincronización. */
(() => {
  const playlists = [
    {file:"seneca-videos.json",playlist:"PL4P4xfIXfbrF57UhR4Y_El-mdtnddYcyn",category:"Cuaderno de Séneca",source:"Cuaderno de Séneca"},
    {file:"ia-videos.json",playlist:"PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj",category:"Videotutoriales IA",source:"Inteligencia Artificial"}
  ];
  const reId=/^[a-zA-Z0-9_-]{11}$/;
  const spanishWords=/(?:\b(?:el|la|los|las|una|un|del|para|con|sin|cómo|qué|tus|mis|sus|este|esta|esto|aprende|profes|profesorado|alumnado|clase|aula|enseñanza|educación|herramienta|guía|crea|gratis|infografías|inteligencia|artificial|mejores|trucos|vídeo|tutoriales|novedades|edita|editarla|secreto|solución|utilizar|usar|séneca|cuaderno|criterios|evaluación|actividades)\b|[áéíóúñ¿¡])/i;
  const englishWords=/\b(?:how to|the best|this video|this tutorial|in this|you can|you will|learn how|for teachers|step by step|getting started|the new|what is|how do|for your|your classroom|using ai|top tips|subscribe to|check out|watch this|download the|workbook|gradebook|grading the quarter)\b/i;
  const isSpanish=v=>!!v && spanishWords.test(v) && !englishWords.test(v);
  function localizedTitle(video,number) {
    const es=String(video.title_es||"").trim(),original=String(video.title||"").trim();
    return (es && !englishWords.test(es) && (isSpanish(es)||video.title_es_verified===true) ? es : isSpanish(original) ? original : "Videotutorial "+number+" · Título pendiente de traducción");
  }
  function localizedDescription(video) {
    const es=String(video.description_es||"").trim(),original=String(video.description||"").trim();
    if(es && !englishWords.test(es) && (isSpanish(es)||video.description_es_verified===true))return es;
    return isSpanish(original)?original:"Consulta la explicación y los recursos del vídeo en YouTube. Traducción de la descripción pendiente.";
  }
  function dateFrom(video) {
    // Nunca usar updated_at: es la fecha del proceso automático, no del vídeo.
    for(const value of [video.published_at,video.published_date,video.upload_date,video.release_date,video.published,video.date]) {
      if(typeof value!=="string")continue;
      const s=value.trim();
      if(/^\d{4}-\d\d-\d\d(?:T|$)/.test(s)){
        const iso=s.slice(0,10);
        if(!Number.isNaN(Date.parse(iso+"T12:00:00Z")))return iso;
      }
      if(/^\d{8}$/.test(s)){
        const iso=s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8);
        if(!Number.isNaN(Date.parse(iso+"T12:00:00Z")))return iso;
      }
    }
    return "";
  }
  function toPost(video,index,feed) {
    const id=String(video.id||"");
    if(!reId.test(id) || !String(video.title||"").trim())return null;
    const date=dateFrom(video);
    const description=localizedDescription(video), title=localizedTitle(video,index+1);
    const sourceUrl="https://www.youtube.com/watch?v="+encodeURIComponent(id)+"&list="+feed.playlist;
    const thumbnail=String(video.thumbnail||"");
    return {
      id:"youtube-"+id,kind:"video",source:feed.source,category:feed.category,
      title,originalTitle:String(video.title||""),
      excerpt:description.length>210?description.slice(0,210).replace(/\s+\S*$/,"")+"…":description,
      content:description,created:date,published:1,
      image:/^https:\/\/[^\s<>"']+$/.test(thumbnail)?thumbnail:"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg",
      youtubeId:id,youtubePlaylist:feed.playlist,
      sourceLinks:[{label:"Ver en YouTube",url:sourceUrl}]
    };
  }
  async function read(feed) {
    try {
      const response=await fetch("./assets/"+feed.file,{cache:"no-store"});
      if(!response.ok)return [];
      const data=await response.json();
      if(data.playlist_id!==feed.playlist || !Array.isArray(data.videos))return [];
      return data.videos.map((v,i)=>toPost(v,i,feed)).filter(Boolean);
    } catch(err) {
      console.warn("No hay metadatos de vídeos para el tablón:",feed.source,err);
      return [];
    }
  }
  window.TI_NEWS={async load(){
    const rows=(await Promise.all(playlists.map(read))).flat();
    const ids=new Set();
    return rows.filter(row=>{if(ids.has(row.youtubeId))return false;ids.add(row.youtubeId);return true;});
  },dateFrom,toPost};
})();

"use strict";
/* V56 · Datos y filtros educativos; no altera ni reescribe publicaciones. */
(() => {
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/º|ª/g,"o").replace(/\s+/g," ").trim();
  const clean = value => String(value||"").trim();
  const courses = ["1.º ESO", "2.º ESO", "3.º ESO", "4.º ESO"];
  const subjects = ["Tecnología", "Robótica", "Inteligencia artificial", "Evaluación", "Dibujo técnico", "Otras materias"];
  const types = ["Videotutorial", "Proyecto", "Infografía", "Lectura", "Plantilla", "Otro recurso"];
  function haystack(post) {return normalize([post.title,post.category,post.excerpt,post.content?.slice(0,1800),...(post.tags||[])].join(" "));}
  function course(post) {
    if(courses.includes(post.level))return post.level;
    const h=haystack(post);
    for(let i=1;i<=4;i++) if(new RegExp("\\b"+i+"\\s*(?:o|er)?\\s*(?:eso|secundaria)\\b").test(h)||new RegExp("\\b"+i+"\\s*eso\\b").test(h))return courses[i-1];
    return "";
  }
  function subject(post) {
    if(subjects.includes(post.subject))return post.subject;
    const h=haystack(post);
    if(/\bdibujo tecnico\b|\bescala\b|\bacotacion\b|\bvistas\b/.test(h))return "Dibujo técnico";
    if(/\brobotica\b|\bmicro:bit\b|\bmaqueen\b|\barduino\b|\bsensores\b/.test(h))return "Robótica";
    if(/\brubrica\b|\bevaluacion\b|\bcriterios\b|\bcuaderno de seneca\b/.test(h))return "Evaluación";
    if(/\binteligencia artificial\b|\bchatgpt\b|\bgemini\b|\bprompts?\b|\brecursos ia\b/.test(h))return "Inteligencia artificial";
    if(/\btecnologia\b|\bproyectos\b|\bestructuras\b|\bcircuitos\b|\belectricidad\b/.test(h))return "Tecnología";
    return "Otras materias";
  }
  function type(post) {
    if(post.kind==="video"||post.youtubeId)return "Videotutorial";
    if(types.includes(post.resourceType))return post.resourceType;
    const h=haystack(post);
    if(/\bproyecto\b|\bmaqueta\b|\bconstruccion\b/.test(h))return "Proyecto";
    if(/\binfografia\b|\bcarrusel\b|\blamina\b/.test(h))return "Infografía";
    if(/\blectura\b|\btexto para leer\b/.test(h))return "Lectura";
    if(/\bplantilla\b|\bficha imprimible\b/.test(h))return "Plantilla";
    return "Otro recurso";
  }
  function matches(post,{course:courseName="",subject:subjectName="",type:typeName=""}={}){
    return (!courseName||course(post)===courseName)&&(!subjectName||subject(post)===subjectName)&&(!typeName||type(post)===typeName);
  }
  function sort(posts,mode="new"){
    if(mode==="old")return [...posts].sort((a,b)=>String(a.created||"").localeCompare(String(b.created||"")));
    if(mode==="az")return [...posts].sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""),"es"));
    return [...posts].sort((a,b)=>String(b.created||"").localeCompare(String(a.created||"")));
  }
  function permalink(post){
    const id=typeof post==="object"?post.id:post;
    const script=document.querySelector('script[src*="ti-search-v56.js"]');
    const root=script?new URL("../",script.src):new URL(location.pathname.includes("/admin/")?"../":"./",document.baseURI);
    return new URL("?post="+encodeURIComponent(clean(id)),root).href;
  }
  async function share(post){
    const url=permalink(post);
    const title=typeof post==="object"?post.title||"TecnologíaInsti":"TecnologíaInsti";
    if(navigator.share){try{await navigator.share({title,url});return true;}catch(e){if(e?.name==="AbortError")return false;}}
    try{await navigator.clipboard.writeText(url);return true;}catch{
      window.prompt("Copia este enlace permanente:",url);return true;
    }
  }
  window.TI_V56=Object.freeze({courses,subjects,types,course,subject,type,matches,sort,permalink,share});
})();

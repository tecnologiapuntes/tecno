"use strict";
/* Fuente común del menú público y del editor de TecnologíaInsti. */
(() => {
  const defaults = {version:3,items:[
    {id:"ia",label:"Inteligencia Artificial",type:"filter",value:"Inteligencia Artificial",description:"Prompts y recursos para el aula",children:[
      {id:"ia-prompts",label:"Prompts",type:"filter",value:"Prompts"},
      {id:"ia-recursos",label:"Recursos IA",type:"filter",value:"Recursos IA"},
      {id:"ia-videos",label:"Videotutoriales",type:"page",value:"videotutoriales-ia.html"}]},
    {id:"proyectos",label:"Proyectos",type:"filter",value:"Proyectos",description:"Proyectos y actividades por curso",children:[
      {id:"p-2",label:"2.º ESO",type:"filter",value:"2º ESO"},
      {id:"p-3",label:"3.º ESO",type:"filter",value:"3º ESO"},
      {id:"p-4",label:"4.º ESO",type:"filter",value:"4º ESO"}]},
    {id:"docentes",label:"Herramientas docentes",type:"filter",value:"Herramientas docentes",description:"Recursos para el profesorado",children:[
      {id:"d-seneca",label:"Cuaderno de Séneca",type:"page",value:"cuaderno-seneca.html"},
      {id:"d-herramientas",label:"Herramientas docentes",type:"filter",value:"Utilidades Séneca"}]}
  ]};
  const clone = v => JSON.parse(JSON.stringify(v));
  const text = (v,n=100) => String(v??"").trim().slice(0,n);
  const validPage = v => /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html(?:#[a-z0-9_-]+)?$/i.test(v);
  const validUrl = v => /^https:\/\/[^\s<>"']+$/i.test(v);
  function normalize(raw){
    if(!raw||!Array.isArray(raw.items)) return clone(defaults);
    // V50: migración única de menús guardados en versiones anteriores, preservando
    // apartados personales. Tras guardar versión 3 se podrán borrar o mover
    // Videotutoriales sin que la aplicación lo vuelva a añadir.
    const document=clone(raw);
    if(Number(document.version||1)<3){
      const ia=document.items.find(i=>i.id==="ia"||/inteligencia artificial/i.test(i.label||""));
      if(ia){
        if(!Array.isArray(ia.children))ia.children=[];
        if(!ia.children.some(c=>c.id==="ia-videos"||c.value==="videotutoriales-ia.html"||/videotutoriales/i.test(c.label||""))){
          ia.children.push({id:"ia-videos",label:"Videotutoriales",type:"page",value:"videotutoriales-ia.html"});
        }
      }
    }
    const used = new Set();
    const process=(item,isChild)=>{
      if(!item||typeof item!=="object")return null;
      const label=text(item.label,70),id=text(item.id,80),type=text(item.type,12),value=text(item.value,450);
      if(!label || !id || !/^[a-z0-9_-]+$/i.test(id) || used.has(id) || !["filter","page","url"].includes(type))return null;
      if(type==="page"&&!validPage(value))return null;
      if(type==="url"&&!validUrl(value))return null;
      if(type==="filter"&&!value)return null;
      used.add(id);
      const out={id,label,type,value};
      if(!isChild){out.description=text(item.description,150);out.children=Array.isArray(item.children)?item.children.slice(0,60).map(c=>process(c,true)).filter(Boolean):[];}
      return out;
    };
    return {version:3,items:document.items.slice(0,24).map(x=>process(x,false)).filter(Boolean)};
  }
  function href(item){
    if(item.type==="page"&&validPage(item.value)){
      // V48: this page has a playlist ID correction. Keep its URL fresh
      // even if the CMS menu was saved before the update.
      if(item.value.split("#")[0]==="videotutoriales-ia.html"){
        const fragment=item.value.includes("#")?"#"+item.value.split("#")[1]:"";
        return "./videotutoriales-ia.html?lista=PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj&v=49"+fragment;
      }
      return "./"+item.value;
    }
    if(item.type==="url"&&validUrl(item.value))return item.value;
    return "./index.html?seccion="+encodeURIComponent(item.value)+"#publicaciones";
  }
  // Los apartados de tipo «filter» son categorías de publicación.
  // Las dos páginas que admiten entradas añadidas desde el CMS también se
  // ofrecen como destino y muestran esas entradas dentro de su propia página.
  const POST_PAGES={"videotutoriales-ia.html":"Videotutoriales IA","cuaderno-seneca.html":"Cuaderno de Séneca"};
  function publishCategory(item){
    if(item.type==="filter")return item.value;
    if(item.type==="page")return POST_PAGES[String(item.value).split("#")[0]]||null;
    return null;
  }
  function categories(menu){
    const list=[];
    const group=(item,label)=>{
      const value=publishCategory(item);
      if(value)list.push({value,label});
      // Las demás páginas/enlaces se señalan en el selector, pero no se
      // ofrecen como categoría ya que no disponen de listado de publicaciones.
      else list.push({value:"",label:label+" (solo enlace, no admite publicaciones)",disabled:true});
    };
    for(const item of normalize(menu).items){
      group(item,item.label+" (apartado principal)");
      for(const child of item.children)group(child,`${item.label} → ${child.label}`);
    }
    // No permitir duplicados por categoría; mantener opciones informativas.
    const seen=new Set();return list.filter(item=>{
      if(!item.value)return true;
      if(seen.has(item.value))return false;
      seen.add(item.value);return true;
    });
  }
  window.TI_MENU={defaults,clone,normalize,href,categories,validUrl,validPage};
})();

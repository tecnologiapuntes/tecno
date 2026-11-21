"use strict";
/* Fuente común del menú público y del editor de TecnologíaInsti. */
(() => {
  const defaults = {version:2,items:[
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
    // V46: migrar menús guardados desde la V45 sin perder sus apartados propios.
    // Cuando el usuario guarde el menú de nuevo quedará en versión 2 y podrá
    // mover o eliminar «Videotutoriales» sin que vuelva a añadirse.
    const document=clone(raw);
    if(Number(document.version||1)<2){
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
    return {version:2,items:document.items.slice(0,24).map(x=>process(x,false)).filter(Boolean)};
  }
  function href(item){
    if(item.type==="page"&&validPage(item.value))return "./"+item.value;
    if(item.type==="url"&&validUrl(item.value))return item.value;
    return "./index.html?seccion="+encodeURIComponent(item.value)+"#publicaciones";
  }
  function categories(menu){
    const list=[];
    for(const item of normalize(menu).items) {
      if(item.type==="filter")list.push({value:item.value,label:item.label+" (apartado principal)"});
      for(const c of item.children)if(c.type==="filter")list.push({value:c.value,label:`${item.label} → ${c.label}`});
    }
    return [...new Map(list.map(x=>[x.value,x])).values()];
  }
  window.TI_MENU={defaults,clone,normalize,href,categories,validUrl,validPage};
})();

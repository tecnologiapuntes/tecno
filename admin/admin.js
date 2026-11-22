"use strict";
// TecnologíaInsti · Panel GitHub V52. Editor con formato y menús jerárquicos.
(() => {
  const OWNER = "tecnologiapuntes";
  const REPO = "tecno";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const POSTS_PATH = "assets/posts.js";
  const CMS_PATH = "assets/cms-posts.json";
  const MENU_PATH = "assets/cms-menu.json";
  const VIDEOS_PATH = "assets/cms-videos.json";
  const SITE_PATH = "assets/cms-site.json";
  const menuCore = window.TI_MENU;
  const root = document;
  const el = (id) => root.getElementById(id);
  const state = {
    token: null, login: null, branch: "main", posts: [], editingId: null,
    original: null, media: [], uploadingDoc: null, busy: false,
    menu: menuCore.normalize(menuCore.defaults), menuBaseline: null, menuEditId: null, menuNextParent: "", activeTab: "posts",
    library: [], libraryLimit: 48, mediaPickerMode:"",selectedDoc:null,
    site:null,siteBaseline:null,siteImageFile:null,
    manualVideos:[],videoBaseline:null,videoEditingId:null
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const localDate = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
  };
  const normalize = (value) => String(value ?? "").trim();
  const short = (s,n=105) => s.length>n?s.slice(0,n-1)+"…":s;
  const slug = (name) => normalize(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g, "").slice(0,48) || "publicacion";
  const assetUrl = (path) => {
    const src = String(path || "");
    if (/^assets\/[a-z0-9_./-]+$/i.test(src) && !src.includes("..")) return new URL("../" + src, document.baseURI).href;
    if (/^https:\/\//.test(src)) return src;
    return new URL("../assets/logo-tecnologiainsti.webp", document.baseURI).href;
  };
  function status(area, message, type="pending") {
    const target = el(area);
    target.className = type;
    target.textContent = message;
  }
  function errMessage(e) {
    const msg = e && e.message ? e.message : String(e);
    if (/401|Bad credentials/i.test(msg)) return "GitHub no acepta el token. Comprueba que esté activo y pégalo de nuevo.";
    if (/403|Resource not accessible/i.test(msg)) return "Acceso denegado. Revisa que el token tenga permiso «Contents: Read and write» para tecnologiapuntes/tecno.";
    if (/409|422|fast forward|reference update failed/i.test(msg)) return "GitHub recibió otros cambios mientras publicabas. Pulsa «Actualizar lista» y vuelve a intentarlo. No se han sobrescrito las publicaciones.";
    return msg;
  }
  async function github(path, opts={}) {
    if (!state.token) throw new Error("Conecta primero con GitHub.");
    const res = await fetch(path.startsWith("https://") ? path : API + path, {
      ...opts,
      headers: {
        "Accept":"application/vnd.github+json",
        "Authorization":`Bearer ${state.token}`,
        "X-GitHub-Api-Version":"2022-11-28",
        ...(opts.body ? {"Content-Type":"application/json"}:{}),
        ...(opts.headers || {})
      },
      cache:"no-store"
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) {
      const detail = data.message || res.statusText || "Error desconocido";
      throw new Error(`${res.status} · ${detail}`);
    }
    return data;
  }
  function bytesFromB64(b64) {
    const binary = atob(String(b64).replace(/\s+/g,""));
    const out = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) out[i]=binary.charCodeAt(i);
    return out;
  }
  function b64FromBytes(bytes) {
    let out="";
    const chunk = 16384;
    for (let i=0;i<bytes.length;i+=chunk) out+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(out);
  }
  function parsePosts(source) {
    const text = source.replace(/^\s*window\.TECNOLOGIA_POSTS\s*=\s*/,"").trim().replace(/;\s*$/,"");
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.some(p => !p || typeof p!=="object" || !p.id || !p.title)) throw new Error("El archivo de publicaciones no tiene el formato esperado.");
    return parsed;
  }
  function serializePosts(posts) {
    return "window.TECNOLOGIA_POSTS = " + JSON.stringify(posts, null, 2) + ";\n";
  }
  async function readRemotePosts() {
    const response = await github(`/contents/${POSTS_PATH}?ref=${encodeURIComponent(state.branch)}`);
    if (response.encoding !== "base64" || !response.content) throw new Error("GitHub no ha devuelto el archivo de publicaciones completo.");
    const text = new TextDecoder().decode(bytesFromB64(response.content));
    return parsePosts(text);
  }
  function mergePosts(legacy,cms) {
    const excluded = new Set(cms.hiddenIds || []);
    const entries = new Map();
    for (const post of legacy) if(!excluded.has(post.id)) entries.set(post.id,post);
    for (const post of cms.posts) if(!excluded.has(post.id)) entries.set(post.id,post);
    return [...entries.values()].sort((a,b)=>String(b.created||"").localeCompare(String(a.created||"")));
  }
  async function readRemoteCms() {
    try {
      const result=await github(`/contents/${CMS_PATH}?ref=${encodeURIComponent(state.branch)}`);
      if(result.encoding!=="base64") throw new Error("El documento de publicaciones administradas es ilegible.");
      const doc=JSON.parse(new TextDecoder().decode(bytesFromB64(result.content)));
      if(!doc || !Array.isArray(doc.posts) || !Array.isArray(doc.hiddenIds)) throw new Error("El formato de las publicaciones administradas no es válido.");
      return doc;
    } catch(e) {
      if(/^404 · /.test(e.message))return {version:1,posts:[],hiddenIds:[]};
      throw e;
    }
  }
  async function readRemoteMenu(){
    try{
      const response=await github(`/contents/${MENU_PATH}?ref=${encodeURIComponent(state.branch)}`);
      if(response.encoding!=="base64")throw Error("No se pudo leer el menú de GitHub.");
      const raw=JSON.parse(new TextDecoder().decode(bytesFromB64(response.content)));
      const normalized=menuCore.normalize(raw);
      if(normalized.items.length!==raw.items?.length)throw Error("El archivo del menú contiene entradas incompatibles.");
      return normalized;
    }catch(e){
      if(/^404 · /.test(e.message))return menuCore.normalize(menuCore.defaults);
      throw e;
    }
  }
  function fillCategories(){
    const cat=el("postCategory"), prior=cat.value;
    const list=menuCore.categories(state.menu);
    // Mantener la opción de editar entradas de categorías históricas.
    for(const p of state.posts)if(p.category&&!list.some(x=>x.value===p.category))list.push({value:p.category,label:p.category+" (existente)"});
    if(!list.some(x=>x.value))list.push({value:"Prompts",label:"Prompts"});
    cat.replaceChildren(...list.map(({value,label,disabled})=>{
      const option=new Option(label,value);option.disabled=!!disabled;return option;
    }));
    if([...cat.options].some(o=>!o.disabled&&o.value===prior))cat.value=prior;
    else cat.value=cat.querySelector('option:not([disabled])')?.value||"";
    explainCategory();
  }
  function explainCategory(){
    const cat=el("postCategory").value;
    const hint=el("categoryHint");
    if(cat==="Videotutoriales IA")hint.textContent="Este post aparecerá debajo de los videotutoriales, en la página de Inteligencia Artificial → Videotutoriales.";
    else if(cat==="Cuaderno de Séneca")hint.textContent="Este post aparecerá también dentro de la página de Cuaderno de Séneca.";
    else hint.textContent="Los apartados nuevos de tipo categoría se cargan desde tu menú de GitHub. Las páginas o enlaces externos sin listado de publicaciones no se pueden seleccionar como destino.";
  }
  async function syncMenuCategories({force=false}={}){
    // Nunca descartar cambios de menú que el usuario esté editando sin guardar.
    if(!force&&state.menuBaseline&&state.menuBaseline!==JSON.stringify(state.menu))return false;
    const remote=await readRemoteMenu();
    state.menu=remote;
    state.menuBaseline=JSON.stringify(remote);
    fillCategories();renderMenuTree();
    return true;
  }
  async function latestData() {
    const [legacy,cms]=await Promise.all([readRemotePosts(),readRemoteCms()]);
    return {legacy,cms,combined:mergePosts(legacy,cms)};
  }
  async function refreshPosts() {
    // Consultar siempre el menú más reciente al actualizar la lista.
    const [latest]=await Promise.all([latestData(),syncMenuCategories()]);
    state.posts=latest.combined;
    fillCategories();renderList();
  }
  function renderList() {
    const posts = [...state.posts].sort((a,b)=>String(b.created||"").localeCompare(String(a.created||"")));
    el("totalCount").textContent=String(posts.length);
    el("publishedCount").textContent=String(posts.filter(p=>p.published).length);
    el("draftCount").textContent=String(posts.filter(p=>postState(p)!=="public").length);
    const q=normalize(el("searchPosts").value).toLowerCase(),tag=normalize(el("filterTag").value).toLowerCase();
    const statusValue=el("filterStatus").value,cat=el("filterCategory").value;
    const from=el("filterFrom").value,to=el("filterTo").value;
    const categories=[...new Set(posts.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    const select=el("filterCategory"),oldCategory=select.value;
    select.replaceChildren(new Option("Todos", ""),...categories.map(c=>new Option(c,c)));
    if(categories.includes(oldCategory))select.value=oldCategory;
    const filtered=posts.filter(p=>{
      const stateValue=postState(p);
      if(statusValue&&statusValue!==stateValue)return false;
      if(cat&&p.category!==cat)return false;
      if(from&&String(p.created||"")<from)return false;
      if(to&&String(p.created||"")>to)return false;
      if(tag&&!(p.tags||[]).some(t=>t.toLowerCase().includes(tag)))return false;
      return [p.title,p.category,p.created,p.excerpt,...(p.tags||[])].join(" ").toLowerCase().includes(q);
    });
    const container=el("postList");
    if(!filtered.length){container.innerHTML='<div class="empty">No hay publicaciones con ese término.</div>';return;}
    container.innerHTML=filtered.map(p=>`<article class="post-row" data-id="${esc(p.id)}">
      <img class="post-thumb" src="${esc(assetUrl(p.image))}" loading="lazy" alt="" />
      <div class="post-text"><h3>${esc(short(p.title,150))}${postState(p)==="draft"?'<span>BORRADOR</span>':postState(p)==="scheduled"?'<span>PROGRAMADA</span>':""}</h3><p>${esc(p.category)} · ${esc(p.created||"Sin fecha")}${postState(p)==="scheduled"?" · Publicar: "+esc(new Date(p.publishAt).toLocaleString("es-ES",{timeZone:"Europe/Madrid"})):""}</p></div>
      <div class="post-actions"><button class="btn secondary" type="button" data-edit="${esc(p.id)}">Editar</button><button type="button" class="btn danger" data-remove="${esc(p.id)}">Eliminar</button></div>
    </article>`).join("");
  }
  function releasePreviews() {
    for (const media of state.media) if (media.url && media.file) URL.revokeObjectURL(media.url);
    state.media=[];
  }
  async function newEditor(id=null) {
    if(state.busy)return;
    try{await syncMenuCategories();}
    catch(e){
      // La edición continúa con el último menú conocido; avisamos del fallo.
      status("menuStatus","No se han podido actualizar los apartados: "+errMessage(e),"error");
    }
    state.editingId=id;
    state.original=id ? structuredClone(state.posts.find(p=>p.id===id)) : null;
    const p=state.original || {};
    releasePreviews();
    const images=(p.images?.length?p.images:(p.image?[p.image]:[]));
    state.media=images.map(path=>({path}));
    state.uploadingDoc=null;
    el("editorTitle").textContent = id ? "Editar publicación" : "Nueva publicación";
    el("postTitle").value=p.title || "";
    const category=el("postCategory");
    if(p.category && !Array.from(category.options).some(o=>o.value===p.category)) {
      const option=new Option(p.category,p.category);category.append(option);
    }
    category.value=p.category || ([...category.options].find(o=>!o.disabled)?.value || "Prompts");
    explainCategory();
    el("postDate").value=p.created || localDate();
    el("postExcerpt").value=p.excerpt || "";
    el("postContent").value=p.content || "";
    updatePostPreview();
    const scheduled=p.published && p.publishAt && Date.parse(p.publishAt)>Date.now();
    el("postPublishMode").value=!p.published?"draft":scheduled?"scheduled":"now";
    el("postSchedule").value=p.publishAt?toMadridLocal(p.publishAt):"";
    toggleSchedule("post");
    el("postTags").value=(Array.isArray(p.tags)?p.tags:[]).join(", ");
    state.selectedDoc=null;
    el("selectedDocumentLabel").textContent="";
    el("removeSelectedDoc").hidden=true;
    el("attachmentInput").value="";
    el("photoInput").value="";
    el("currentAttachment").textContent=p.attachment ? `Documento actual: ${p.attachmentName || p.attachment}` : "";
    el("linksList").innerHTML="";
    for(const link of (p.sourceLinks || [])) addLinkRow(link.label,link.url);
    if(!(p.sourceLinks||[]).length) addLinkRow();
    el("saveStatus").textContent="";
    renderMedia();
    el("listPanel").hidden=true;
    el("editorPanel").hidden=false;
    el("editorPanel").scrollIntoView({behavior:"auto",block:"start"});
  }
  function closeEditor() {
    if(state.busy) return;
    el("editorPanel").hidden=true;
    el("listPanel").hidden=false;
    releasePreviews();
    state.editingId=null;
    state.original=null;
    state.uploadingDoc=null;
  }
  function addLinkRow(label="",url="") {
    const row=document.createElement("div");
    row.className="link-pair";
    row.innerHTML=`<input aria-label="Nombre del enlace" placeholder="Nombre del enlace (ej.: Descargar Word)" value="${esc(label)}" />
      <input type="text" inputmode="url" aria-label="Dirección URL" placeholder="https://drive.google.com/..." value="${esc(url)}" />
      <button class="mini-btn" type="button" aria-label="Quitar enlace">✕</button>`;
    row.querySelector("button").addEventListener("click",()=>row.remove());
    el("linksList").append(row);
  }
  function collectLinks() {
    return Array.from(el("linksList").children).map(row=>{
      const [label,url]=row.querySelectorAll("input");
      return {label:normalize(label.value),url:normalize(url.value)};
    }).filter(x=>x.label||x.url).map(x=>{
      if(!x.label||!x.url) throw new Error("Completa tanto el nombre como la dirección de cada enlace, o elimina la fila incompleta.");
      if(!/^https:\/\//i.test(x.url) && !/^assets\/[\w./-]+$/i.test(x.url)) throw new Error(`El enlace «${x.label}» debe comenzar por https://`);
      return x;
    });
  }
  function renderMedia() {
    const gallery=el("gallery");
    if(!state.media.length){gallery.innerHTML='<p class="gallery-empty">Todavía no has añadido imágenes. La primera que subas se utilizará como portada.</p>';return;}
    gallery.innerHTML=state.media.map((media,i)=>`<div class="gallery-item" data-i="${i}">
      <img src="${esc(media.url||assetUrl(media.path))}" alt="Lámina ${i+1}" />
      <p class="gallery-title">${i===0?"★ Portada":`Lámina ${i+1}`} ${media.file?"· nueva":""}</p>
      <div class="gallery-actions"><button class="mini-btn" type="button" data-move="up" ${i===0?"disabled":""} title="Mover izquierda">←</button>
      <button class="mini-btn" type="button" data-move="down" ${i===state.media.length-1?"disabled":""} title="Mover derecha">→</button>
      <button class="mini-btn" type="button" data-move="remove" title="Quitar imagen">✕</button></div></div>`).join("");
  }
  function addImages(files) {
    for (const file of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {alert(`Archivo no compatible: ${file.name}`);continue;}
      if (file.size>10*1024*1024) {alert(`Archivo demasiado grande: ${file.name}. El máximo es 10 MB.`);continue;}
      state.media.push({file,url:URL.createObjectURL(file)});
    }
    renderMedia();
  }
  async function convertToWebp(file) {
    let bitmap;
    try {bitmap=await createImageBitmap(file);}catch {throw new Error(`No se puede abrir la imagen «${file.name}».`);}
    const size = Math.min(1, 1800/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*size));
    canvas.height=Math.max(1,Math.round(bitmap.height*size));
    const ctx=canvas.getContext("2d");
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.88));
    canvas.width=canvas.height=0;
    if(!blob||blob.type!=="image/webp") throw new Error("El navegador no ha podido convertir las imágenes a WebP.");
    return blob;
  }
  async function blobToBase64(blob) {
    return b64FromBytes(new Uint8Array(await blob.arrayBuffer()));
  }
  async function createGitBlob(blobOrString) {
    const body=typeof blobOrString==="string"
      ? {content:blobOrString,encoding:"utf-8"}
      : {content:await blobToBase64(blobOrString),encoding:"base64"};
    const result=await github("/git/blobs",{method:"POST",body:JSON.stringify(body)});
    return result.sha;
  }
  async function atomicCommit(changes,message) {
    // Git tree: suma los cambios a la versión actual, preservando archivos no afectados,
    // especialmente assets/seneca-videos.json (generado por GitHub Actions).
    const refPath=`/git/ref/heads/${encodeURIComponent(state.branch)}`;
    const head=await github(refPath);
    const commit=await github(`/git/commits/${head.object.sha}`);
    const entries=changes.map(({path,sha})=>({path,mode:"100644",type:"blob",sha}));
    const tree=await github("/git/trees",{method:"POST",body:JSON.stringify({base_tree:commit.tree.sha,tree:entries})});
    const next=await github("/git/commits",{method:"POST",body:JSON.stringify({message,tree:tree.sha,parents:[head.object.sha]})});
    await github(`/git/refs/heads/${encodeURIComponent(state.branch)}`,{method:"PATCH",body:JSON.stringify({sha:next.sha,force:false})});
    return next.sha;
  }
  function setBusy(busy) {
    state.busy=busy;
    el("savePost").disabled=busy;
    el("savePost").textContent=busy?"Publicando…":"Guardar en GitHub";
    el("cancelEdit").disabled=busy;
    el("cancelEditBottom").disabled=busy;
  }
  async function savePost(event) {
    event.preventDefault();
    if(state.busy)return;
    const title=normalize(el("postTitle").value),content=normalize(el("postContent").value);
    const category=el("postCategory").value;
    let created=el("postDate").value;
    if(el("postPublishMode").value==="scheduled"&&el("postSchedule").value)created=el("postSchedule").value.slice(0,10);
    if(!title||!content||!created||!category) {status("saveStatus","Completa el título, el apartado, la fecha y el texto.","error");return;}
    let links;
    try {links=collectLinks();}catch(e){status("saveStatus",e.message,"error");return;}
    setBusy(true);
    status("saveStatus","Comprobando los datos más recientes de GitHub…");
    try {
      const data=await latestData();
      const old=data.combined.find(p=>p.id===state.editingId);
      if(state.editingId && !old) throw new Error("Esta publicación ya no existe en GitHub. Actualiza la lista.");
      if(old && JSON.stringify(old)!==JSON.stringify(state.original)) throw new Error("Esta publicación fue modificada desde otra sesión. Actualiza la lista antes de guardarla para no perder esos cambios.");
      const id=state.editingId||`web-${slug(title)}-${Date.now().toString(36)}`;
      const uploads=[];
      const imagePaths=[];
      const unique=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
      let i=0;
      for(const media of state.media) {
        if(!media.file){imagePaths.push(media.path);continue;}
        status("saveStatus",`Optimizando imagen ${++i} de ${state.media.filter(m=>m.file).length}…`);
        const converted=await convertToWebp(media.file);
        const path=`assets/posts/${id}-${unique()}.webp`;
        uploads.push({path,blob:converted});
        imagePaths.push(path);
      }
      let attachment=old?.attachment||"";
      let attachmentName=old?.attachmentName||"";
      if(state.uploadingDoc) {
        if(state.uploadingDoc.size>10*1024*1024)throw new Error("El documento supera el máximo de 10 MB.");
        const doc=state.uploadingDoc;
        const extension=(doc.name.match(/\.(docx|pdf|doc|xlsx|pptx)$/i)||[])[1];
        if(!extension)throw new Error("El documento debe ser Word, PDF, Excel o PowerPoint.");
        attachment=`assets/descargas/${id}-${unique()}.${extension.toLowerCase()}`;
        attachmentName=`Descargar ${doc.name}`;
        uploads.push({path:attachment,blob:doc});
        links=links.filter(l=>!old?.attachment || l.url!==old.attachment);
        links.push({label:attachmentName,url:attachment});
      }
      let excerpt=normalize(el("postExcerpt").value);
      if(!excerpt)excerpt=window.TI_POST_FORMAT.plain(content).slice(0,230);
      const newPost={
        ...(old||{}),id,title,category,excerpt,created,content,sourceLinks:links,
        published:el("postPublishMode").value!=="draft"?1:0,
        tags:parseTags(el("postTags").value),
        image:imagePaths[0]||""
      };
      const mode=el("postPublishMode").value;
      if(mode==="scheduled")newPost.publishAt=madridToUTC(el("postSchedule").value);
      else delete newPost.publishAt;
      if(imagePaths.length>1)newPost.images=imagePaths;
      else delete newPost.images;
      if(state.selectedDoc){
        attachment=state.selectedDoc.path;
        attachmentName="Descargar "+state.selectedDoc.name;
        links=links.filter(l=>l.url!==old?.attachment);
        links.push({label:attachmentName,url:attachment});
        newPost.sourceLinks=links;
      }
      if(attachment){newPost.attachment=attachment;newPost.attachmentName=attachmentName;}
      const cms=data.cms;
      cms.posts=cms.posts.filter(p=>p.id!==id);
      cms.posts.push(newPost);
      cms.hiddenIds=cms.hiddenIds.filter(x=>x!==id);
      cms.updatedAt=new Date().toISOString();
      const combined=mergePosts(data.legacy,cms);
      const changes=[];
      let done=0;
      for(const upload of uploads) {
        status("saveStatus",`Subiendo recurso ${++done} de ${uploads.length}…`);
        const sha=await createGitBlob(upload.blob);
        changes.push({path:upload.path,sha});
      }
      const postsBlob=await createGitBlob(JSON.stringify(cms,null,2)+"\n");
      changes.push({path:CMS_PATH,sha:postsBlob});
      status("saveStatus","Guardando todos los cambios en un único commit…");
      await atomicCommit(changes,`${state.editingId?"Actualizar":"Crear"} publicación: ${title.slice(0,80)}`);
      state.posts=combined;
      setBusy(false);
      closeEditor();
      renderList();
      status("loginMessage","", "success");
      alert("Publicación guardada correctamente en GitHub. Puede tardar unos minutos en verse en GitHub Pages.");
    } catch(e) {status("saveStatus",errMessage(e),"error");}
    finally {setBusy(false);}
  }
  async function deletePost(id) {
    if(state.busy)return;
    const p=state.posts.find(x=>x.id===id);
    if(!p)return;
    if(!confirm(`¿Eliminar la publicación «${p.title}»?\n\nSe dejarán intactos los archivos de las imágenes, por seguridad.`))return;
    state.busy=true;
    try{
      const data=await latestData();
      const remote=data.combined.find(x=>x.id===id);
      if(!remote){alert("Esta publicación ya fue eliminada. Actualiza el listado.");return;}
      const cms=data.cms;
      cms.posts=cms.posts.filter(x=>x.id!==id);
      if(data.legacy.some(x=>x.id===id) && !cms.hiddenIds.includes(id)) cms.hiddenIds.push(id);
      cms.updatedAt=new Date().toISOString();
      const others=mergePosts(data.legacy,cms);
      const sha=await createGitBlob(JSON.stringify(cms,null,2)+"\n");
      await atomicCommit([{path:CMS_PATH,sha}],`Eliminar publicación: ${p.title.slice(0,80)}`);
      state.posts=others;renderList();
      alert("Publicación eliminada del listado de la web.");
    }catch(e){alert(errMessage(e));}
    finally{state.busy=false;}
  }
  async function connect(event) {
    event.preventDefault();
    if(state.busy)return;
    const token=normalize(el("token").value);
    if(!token){status("loginMessage","Introduce un token válido.","error");return;}
    state.token=token;
    state.busy=true;
    el("connectButton").disabled=true;
    status("loginMessage","Verificando acceso al repositorio…");
    try{
      const user=await github("https://api.github.com/user");
      const repo=await github("");
      state.login=user.login||"GitHub";
      state.branch=repo.default_branch||"main";
      if(repo.permissions && repo.permissions.push===false)throw new Error("Tu cuenta no tiene permiso para publicar en este repositorio.");
      await refreshPosts();
      el("token").value="";
      el("loginPanel").hidden=true;
      el("workspace").hidden=false;
      el("accountLabel").textContent=`@${state.login}`;
      el("accountLabel").hidden=false;
      el("signOut").hidden=false;
      status("loginMessage","","success");
    }catch(e){state.token=null;status("loginMessage",errMessage(e),"error");}
    finally{state.busy=false;el("connectButton").disabled=false;}
  }
  function signOut(){
    state.token=null;state.posts=[];state.login=null;state.original=null;state.editingId=null;releasePreviews();
    state.menu=menuCore.normalize(menuCore.defaults);state.menuBaseline=null;state.activeTab="posts";
    state.library=[];state.selectedDoc=null;state.site=null;state.siteBaseline=null;state.manualVideos=[];state.videoBaseline=null;
    el("workspace").hidden=true;el("loginPanel").hidden=false;el("accountLabel").hidden=true;el("signOut").hidden=true;
    el("token").value="";
    status("loginMessage","Sesión cerrada. Tu token no se ha guardado.","success");
  }

  function switchTab(tab){
    if(state.busy)return;
    state.activeTab=tab;
    for(const [name,id] of Object.entries({posts:"tabPosts",menus:"tabMenus",media:"tabMedia",site:"tabSite",videos:"tabVideos"})){
      el(id).classList.toggle("active",name===tab);
      el(id).setAttribute("aria-selected",String(name===tab));
    }
    el("editorPanel").hidden=true;
    el("listPanel").hidden=tab!=="posts";
    el("menuPanel").hidden=tab!=="menus";
    el("mediaPanel").hidden=tab!=="media";
    el("sitePanel").hidden=tab!=="site";
    el("videosPanel").hidden=tab!=="videos";
    if(tab==="menus")renderMenuTree();
    if(tab==="media")loadLibrary().catch(e=>status("mediaStatus",errMessage(e),"error"));
    if(tab==="site")loadSite().catch(e=>status("siteStatus",errMessage(e),"error"));
    if(tab==="videos")loadManualVideos().catch(e=>status("videoStatus",errMessage(e),"error"));
  }
  function findMenuItem(id){
    let result=null;
    function go(list,parent,depth,ancestors){
      for(const item of list){
        if(item.id===id){result={item,parent,list,depth,ancestors};return;}
        if(item.children?.length&&depth<3)go(item.children,item,depth+1,[...ancestors,item]);
        if(result)return;
      }
    }
    go(state.menu.items,null,1,[]);
    return result;
  }
  const subtreeDepth=node=>1+Math.max(0,...(node.children||[]).map(subtreeDepth));
  function renderMenuNode(item,depth,index,length){
    const descendants=item.children||[];
    const level=depth===1?"main":depth===2?"child":"grandchild";
    const desc=item.type==="filter"?"Publicaciones: "+item.value:item.type==="page"?"Página: "+item.value:"Enlace externo";
    const add=depth<3?`<button type="button" data-action="add-child">+ ${depth===1?"Subapartado":"Sub-subapartado"}</button>`:"";
    return `<div class="menu-branch menu-level-${depth}" data-mid="${esc(item.id)}">
      <div class="menu-node ${level}"><div class="menu-node-text"><strong>${esc(item.label)}</strong><small>Nivel ${depth} · ${esc(desc)}${descendants.length?" · "+descendants.length+" dentro":""}</small></div>
      <div class="menu-node-actions"><button type="button" data-action="up" title="Subir" ${index===0?"disabled":""}>↑</button><button type="button" data-action="down" title="Bajar" ${index===length-1?"disabled":""}>↓</button>${add}<button type="button" data-action="edit">Editar</button><button type="button" data-action="remove" title="Eliminar apartado">✕</button></div></div>
      ${descendants.length?`<div class="menu-children">${descendants.map((child,i)=>renderMenuNode(child,depth+1,i,descendants.length)).join("")}</div>`:""}
    </div>`;
  }
  function renderMenuTree(){
    const box=el("menuTree");
    box.innerHTML=state.menu.items.map((item,index)=>`<section class="menu-group-card">${renderMenuNode(item,1,index,state.menu.items.length)}</section>`).join("");
    if(!state.menu.items.length)box.innerHTML='<p class="empty">Aún no hay apartados. Añade uno para empezar.</p>';
    const changed=state.menuBaseline!==JSON.stringify(state.menu);
    el("menuSave").disabled=!changed||state.busy;
    el("menuSave").textContent=changed?"Guardar menú en GitHub":"Menú sin cambios";
    el("menuReset").disabled=!changed||state.busy;
  }
  function openMenuForm(id=null,parentId=""){
    if(state.busy)return;
    state.menuEditId=id;
    const found=id?findMenuItem(id):null;
    const item=found?.item||{};
    el("menuFormTitle").textContent=id?"Editar elemento":"Nuevo elemento del menú";
    const select=el("menuParent");
    const options=[new Option("Barra principal (apartado)","")];
    menuCore.walk(state.menu,(node,depth,parents)=>{
      if(depth>=3||node.id===id)return;
      // Impedir mover un grupo dentro de sus propios descendientes.
      if(id&&parents.some(p=>p.id===id))return;
      if(found&&depth+subtreeDepth(found.item)>3)return;
      options.push(new Option("  ".repeat(depth-1)+[...parents.map(p=>p.label),node.label].join(" → "),node.id));
    });
    select.replaceChildren(...options);
    select.value=found?.parent?.id||parentId||"";
    if(![...select.options].some(x=>x.value===select.value))select.value="";
    el("menuLabel").value=item.label||"";
    el("menuType").value=item.type||"filter";
    el("menuValue").value=item.value||"";
    el("menuValue").dataset.auto="0";
    el("menuDescription").value=item.description||"";
    el("menuItemForm").hidden=false;
    el("menuLabel").focus();
  }
  function closeMenuForm(){el("menuItemForm").hidden=true;state.menuEditId=null;}
  function moveMenuItem(id,direction){
    const found=findMenuItem(id);if(!found)return;
    const index=found.list.findIndex(x=>x.id===id),to=index+direction;
    if(to<0||to>=found.list.length)return;
    [found.list[index],found.list[to]]=[found.list[to],found.list[index]];
    renderMenuTree();
  }
  function deleteMenuItem(id){
    const found=findMenuItem(id);if(!found)return;
    const affected=found.item.children?.length?"este apartado y todo lo que contiene":"este elemento";
    if(!confirm(`¿Eliminar ${affected}: «${found.item.label}»?\n\nLas publicaciones se conservarán, pero dejarán de tener ese enlace en el menú.`))return;
    found.list.splice(found.list.findIndex(x=>x.id===id),1);
    closeMenuForm();renderMenuTree();fillCategories();
  }
  function applyMenuItem(event){
    event.preventDefault();
    const label=normalize(el("menuLabel").value),type=el("menuType").value;
    const value=normalize(el("menuValue").value)||(type==="filter"?label:"");
    const description=normalize(el("menuDescription").value);
    const parentId=el("menuParent").value;
    if(!label||!value){alert("Rellena el nombre y el destino.");return;}
    if(type==="url"&&!menuCore.validUrl(value)){alert("El enlace externo debe empezar por https:// y no contener espacios.");return;}
    if(type==="page"&&!menuCore.validPage(value)){alert("Escribe una página interna válida, por ejemplo cuaderno-seneca.html");return;}
    const parent=parentId?findMenuItem(parentId):null;
    if(parentId&&!parent){alert("El apartado padre ya no existe. Actualiza el menú.");return;}
    const found=state.menuEditId?findMenuItem(state.menuEditId):null;
    if(parent&&(parent.depth>=3||parent.depth+subtreeDepth(found?.item||{children:[]})>3)){alert("Se permiten hasta tres niveles visibles. Elige un apartado superior.");return;}
    if(found&&(parentId===found.item.id||parent?.ancestors.some(p=>p.id===found.item.id))){alert("No puedes mover un apartado dentro de sí mismo.");return;}
    const oldIndex=found?found.list.findIndex(x=>x.id===found.item.id):-1;
    const sameParent=!!found&&(found.parent?.id||"")===parentId;
    if(found)found.list.splice(oldIndex,1);
    const item=found?.item||{id:"nav-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),children:[]};
    Object.assign(item,{label,type,value});
    if(parentId){
      const list=parent.item.children||(parent.item.children=[]);
      delete item.description;
      if(sameParent)list.splice(oldIndex,0,item);else list.push(item);
    }else{
      item.description=description;
      if(sameParent)state.menu.items.splice(oldIndex,0,item);else state.menu.items.push(item);
    }
    const normalized=menuCore.normalize(state.menu);
    // Importantísimo: nunca guardar cambios que silenciosamente pierdan descendientes.
    const existingIds=[];menuCore.walk(state.menu,n=>existingIds.push(n.id));
    const validIds=[];menuCore.walk(normalized,n=>validIds.push(n.id));
    if(existingIds.length!==validIds.length){alert("El menú excede los límites. Cambios no aplicados.");return;}
    state.menu=normalized;
    closeMenuForm();renderMenuTree();fillCategories();
  }
  async function saveMenu(){
    if(state.busy)return;
    if(state.menuBaseline===JSON.stringify(state.menu))return;
    state.busy=true;renderMenuTree();
    status("menuStatus","Verificando la versión actual del menú en GitHub…");
    try{
      const remote=await readRemoteMenu();
      // A second editor may have saved meanwhile; do not erase those changes.
      if(JSON.stringify(remote)!==state.menuBaseline)throw Error("El menú ha cambiado en GitHub desde que lo abriste. Pulsa «Deshacer cambios» y vuelve a editar sobre la versión actual.");
      const normalized=menuCore.normalize(state.menu);
      if(JSON.stringify(normalized)!==JSON.stringify(state.menu))throw Error("El menú tiene algún elemento no válido.");
      const sha=await createGitBlob(JSON.stringify(normalized,null,2)+"\n");
      await atomicCommit([{path:MENU_PATH,sha}],"Actualizar menús de TecnologíaInsti");
      state.menu=normalized;state.menuBaseline=JSON.stringify(normalized);
      renderMenuTree();fillCategories();
      status("menuStatus","Menús guardados en GitHub. En unos momentos verás las opciones en la barra superior y en el botón «Menú».","success");
    } catch(e){status("menuStatus",errMessage(e),"error");}
    finally{state.busy=false;renderMenuTree();}
  }
  async function reloadMenu(){
    if(state.busy)return;
    if(state.menuBaseline!==JSON.stringify(state.menu) && !confirm("¿Descartar los cambios de menú que aún no has guardado?"))return;
    try{state.menu=await readRemoteMenu();state.menuBaseline=JSON.stringify(state.menu);closeMenuForm();renderMenuTree();fillCategories();status("menuStatus","Menú actualizado desde GitHub.","success");}
    catch(e){status("menuStatus",errMessage(e),"error");}
  }

  // El contenido del editor se conserva como texto ligero (Markdown).
  // El formato se comparte con la web publica y no admite HTML ejecutable.
  function updatePostPreview(){
    const text=el("postContent").value;
    const preview=el("postContentPreview");
    preview.innerHTML=text.trim() ? window.TI_POST_FORMAT.format(text) : '<p class="format-preview-empty">Escribe algo para ver cómo quedará en tu web…</p>';
  }
  function wrapSelection(before,after,placeholder){
    const textarea=el("postContent"),value=textarea.value;
    const start=textarea.selectionStart,end=textarea.selectionEnd;
    const chosen=value.slice(start,end)||placeholder;
    const inserted=before+chosen+after;
    textarea.setRangeText(inserted,start,end,'select');
    textarea.focus();
    textarea.setSelectionRange(start+before.length,start+before.length+chosen.length);
    updatePostPreview();
  }
  function formatPostText(command){
    const textarea=el("postContent"),start=textarea.selectionStart,end=textarea.selectionEnd;
    if(command==='bold')return wrapSelection('**','**','texto en negrita');
    if(command==='italic')return wrapSelection('*','*','texto en cursiva');
    if(command==='underline')return wrapSelection('++','++','texto subrayado');
    if(command==='strike')return wrapSelection('~~','~~','texto tachado');
    if(command==='link'){
      const raw=prompt('Introduce la dirección completa (https://…):','https://');
      if(raw===null)return;
      const url=raw.trim();
      if(!/^https?:\/\/\S+$/i.test(url)||/[()<>"'\s]/.test(url)){
        alert('El enlace debe ser una dirección válida que empiece por https:// (sin espacios).');
        return;
      }
      return wrapSelection('[',']('+url+')','texto del enlace');
    }
    // Aplicar título / lista solo a las líneas seleccionadas, sin anidar marcadores.
    let first=valueLineStart(textarea.value,start),last=end;
    if(last>first&&textarea.value[last-1]==='\n')last--;
    last=valueLineEnd(textarea.value,last);
    const lines=textarea.value.slice(first,last).split('\n');
    const formatted=lines.map((line,i)=>{
      if(command==='heading')return '## '+line.replace(/^#{2,3}\s+/, '');
      if(command==='bullets')return '- '+line.replace(/^(?:[-*•]|\d{1,3}[.)])\s+/, '');
      if(command==='numbers')return (i+1)+'. '+line.replace(/^(?:[-*•]|\d{1,3}[.)])\s+/, '');
      return line;
    }).join('\n');
    textarea.setRangeText(formatted,first,last,'select');
    textarea.focus();textarea.setSelectionRange(first,first+formatted.length);
    updatePostPreview();
  }
  function valueLineStart(value,index){const prev=value.lastIndexOf('\n',Math.max(0,index-1));return prev+1;}
  function valueLineEnd(value,index){const next=value.indexOf('\n',index);return next<0?value.length:next;}


  // V54 · Etiquetas, programación (zona Europe/Madrid), multimedia y metadatos.
  function parseTags(text){
    const seen=new Set();return String(text||"").split(/[;,\n]/).map(v=>v.trim().slice(0,44)).filter(v=>{
      const key=v.toLocaleLowerCase("es");if(!v||seen.has(key))return false;seen.add(key);return true;
    }).slice(0,16);
  }
  function postState(p){return !p?.published?"draft":(p.publishAt && Date.parse(p.publishAt)>Date.now()?"scheduled":"public");}
  function toggleSchedule(kind){
    const mode=el(kind==="post"?"postPublishMode":"videoPublishMode").value;
    el(kind==="post"?"postScheduleField":"videoScheduleField").hidden=mode!=="scheduled";
  }
  function toMadridLocal(iso){
    if(!iso||!Number.isFinite(Date.parse(iso)))return "";
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }
  function madridToUTC(local){
    if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local||""))throw Error("Indica una fecha y hora válida para programar.");
    const candidate=Date.parse(local+":00Z");
    if(!Number.isFinite(candidate))throw Error("La fecha programada no es válida.");
    const timezoneParts=new Intl.DateTimeFormat("en",{timeZone:"Europe/Madrid",timeZoneName:"shortOffset",hour:"2-digit"});
    const match=timezoneParts.formatToParts(new Date(candidate)).find(p=>p.type==="timeZoneName")?.value?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    const offset=match?(match[1]==="+"?1:-1)*(Number(match[2])*60+Number(match[3]||0)):60;
    const iso=new Date(candidate-offset*60000).toISOString();
    if(toMadridLocal(iso)!==local)throw Error("La hora elegida coincide con un cambio horario. Selecciona otra hora.");
    if(Date.parse(iso)<=Date.now())throw Error("Para programar, elige una fecha y hora futuras.");
    return iso;
  }
  async function readJson(path,fallback){
    try{const response=await github(`/contents/${path}?ref=${encodeURIComponent(state.branch)}`);
      const value=JSON.parse(new TextDecoder().decode(bytesFromB64(response.content)));
      return value;
    }catch(error){if(/^404 · /.test(error.message))return structuredClone(fallback);throw error;}
  }
  async function saveJsonAtomic(path,value,message){
    const sha=await createGitBlob(JSON.stringify(value,null,2)+"\n");
    return atomicCommit([{path,sha}],message);
  }
  // ========= Biblioteca multimedia =========
  const documentExt=/\.(pdf|docx?|xlsx|pptx)$/i;
  const imageExt=/\.(webp|jpe?g|png)$/i;
  const typeFromPath=path=>imageExt.test(path)?"image":documentExt.test(path)?"document":"other";
  const nameFromPath=path=>decodeURIComponent(path.split("/").pop()||path);
  function mediaEntries(){return state.library.filter(m=>typeFromPath(m.path)!=="other");}
  async function loadLibrary(){
    status("mediaStatus","Leyendo archivos del repositorio…");
    const head=await github(`/git/ref/heads/${encodeURIComponent(state.branch)}`);
    const commit=await github(`/git/commits/${head.object.sha}`);
    const tree=await github(`/git/trees/${commit.tree.sha}?recursive=1`);
    if(tree.truncated)throw Error("El listado de GitHub está incompleto: el repositorio supera el límite de búsqueda.");
    state.library=(tree.tree||[]).filter(f=>f.type==="blob" && /^assets\/(posts|descargas|biblioteca)\//.test(f.path) && typeFromPath(f.path)!=="other")
      .map(f=>({path:f.path,name:nameFromPath(f.path),size:f.size||0,type:typeFromPath(f.path)}))
      .sort((a,b)=>b.path.localeCompare(a.path,"es"));
    state.libraryLimit=48;renderMediaLibrary();
    status("mediaStatus",`${state.library.length} archivos localizados. Puedes buscarlos y reutilizarlos en cualquier publicación.`,"success");
  }
  function mediaCard(m,picker=false){
    const path=esc(m.path),name=esc(m.name),size=m.size?Math.round(m.size/1024)+" KB":"";
    const thumb=m.type==="image"?`<img src="${esc(assetUrl(m.path))}" loading="lazy" alt=""/>`:`<div class="media-icon">📄</div>`;
    const allowed=!picker || (["image","hero"].includes(state.mediaPickerMode)&&m.type==="image") || (state.mediaPickerMode==="document"&&m.type==="document");
    return `<article class="media-file">${thumb}<strong title="${path}">${name}</strong><small>${m.type==="image"?"Imagen · ":"Documento · "}${size}</small><div class="media-actions">${picker?`<button type="button" class="btn secondary" data-library-use="${path}" ${allowed?"":"disabled"}>${state.mediaPickerMode==="image"?"Añadir al carrusel":"Elegir documento"}</button>`:`<button type="button" class="btn secondary" data-library-copy="${path}">Copiar ruta</button>`}</div></article>`;
  }
  function renderMediaLibrary(){
    const q=normalize(el("mediaSearch").value).toLowerCase(),type=el("mediaType").value;
    const all=mediaEntries().filter(m=>(type==="all"||m.type===type)&&m.path.toLowerCase().includes(q));
    el("mediaGrid").innerHTML=all.slice(0,state.libraryLimit).map(m=>mediaCard(m)).join("") || '<div class="empty">No se encontraron archivos con ese filtro.</div>';
    el("mediaMore").hidden=all.length<=state.libraryLimit;
    el("mediaMore").textContent=`Mostrar más (${Math.max(0,all.length-state.libraryLimit)} restantes)`;
  }
  function renderMediaPicker(){
    const q=normalize(el("mediaPickerSearch").value).toLowerCase();
    const matches=mediaEntries().filter(m=>m.type===(state.mediaPickerMode==="document"?"document":"image")&&m.path.toLowerCase().includes(q));
    el("mediaPickerGrid").innerHTML=matches.slice(0,state.libraryLimit).map(m=>mediaCard(m,true)).join("") || '<p class="empty">No hay archivos de este tipo. Puedes subirlos desde Biblioteca multimedia.</p>';
    el("mediaPickerMore").hidden=matches.length<=state.libraryLimit;
  }
  async function openMediaPicker(mode){
    state.mediaPickerMode=mode;
    state.libraryLimit=48;
    el("mediaPickerTitle").textContent=mode==="document"?"Elegir documento":mode==="hero"?"Elegir imagen de la portada":"Elegir imágenes del carrusel";
    el("mediaPickerSearch").value="";
    el("mediaPicker").showModal();
    if(!state.library.length){try{await loadLibrary();}catch(e){alert(errMessage(e));}}
    renderMediaPicker();
  }
  function useMedia(path){
    const m=state.library.find(x=>x.path===path);if(!m)return;
    if(state.mediaPickerMode==="hero"){
      state.site.hero.image=path;state.siteImageFile=null;el("heroImageUpload").value="";renderSiteImage();
    }else if(state.mediaPickerMode==="document"){
      state.selectedDoc=m;state.uploadingDoc=null;el("attachmentInput").value="";
      el("selectedDocumentLabel").textContent="Documento seleccionado: "+m.name;
      el("removeSelectedDoc").hidden=false;
    }else{
      if(state.media.some(x=>x.path===path)){alert("Esta imagen ya está incluida en el carrusel.");return;}
      state.media.push({path});renderMedia();
    }
    el("mediaPicker").close();
  }
  async function uploadMedia(files){
    if(!files.length||state.busy)return;
    state.busy=true;
    try{
      const changes=[];
      for(let i=0;i<files.length;i++){
        const file=files[i];
        if(file.size>10*1024*1024)throw Error("Archivo superior a 10 MB: "+file.name);
        const kind=/^image\/(png|jpeg|webp)$/.test(file.type)?"image":documentExt.test(file.name)?"document":"other";
        if(kind==="other")throw Error("Formato no permitido: "+file.name);
        status("mediaStatus",`Procesando archivo ${i+1} de ${files.length}: ${file.name}`);
        const suffix=kind==="image"?"webp":file.name.split(".").pop().toLowerCase();
        const blob=kind==="image"?await convertToWebp(file):file;
        const path=`assets/biblioteca/${Date.now().toString(36)}-${slug(file.name)}-${Math.random().toString(36).slice(2,7)}.${suffix}`;
        changes.push({path,sha:await createGitBlob(blob)});
      }
      await atomicCommit(changes,`Añadir ${changes.length} archivo(s) a biblioteca multimedia`);
      await loadLibrary();
      status("mediaStatus",`${changes.length} archivo(s) guardado(s) en GitHub.`,"success");
    }catch(e){status("mediaStatus",errMessage(e),"error");}
    finally{state.busy=false;el("mediaUploadInput").value="";}
  }
  // ========= Portada =========
  const defaultSite=()=>({version:1,hero:{kicker:"EL ESPACIO DE @TECNOLOGIAINSTI",line1:"Del feed",line2:"a tu ",accent:"aula.",description:"Ideas, proyectos y herramientas para enseñar Tecnología y hacer más fácil tu día a día como docente.",primaryText:"Ver novedades",secondaryText:"Nos vemos en Instagram",secondaryUrl:"https://www.instagram.com/tecnologiainsti/",image:""},areasOrder:["Inteligencia Artificial","Proyectos","Herramientas docentes"]});
  async function loadSite(){
    const data=await readJson(SITE_PATH,defaultSite());
    const defaults=defaultSite();
    state.site={version:1,hero:{...defaults.hero,...(data.hero||{})},areasOrder:Array.isArray(data.areasOrder)?data.areasOrder:defaults.areasOrder};
    state.siteBaseline=JSON.stringify(data);
    state.siteImageFile=null;fillSite();status("siteStatus","Portada cargada desde GitHub.","success");
  }
  function fillSite(){
    const h=state.site.hero;
    for(const [field,id] of Object.entries({kicker:"heroKicker",line1:"heroLine1",line2:"heroLine2",accent:"heroAccent",description:"heroDescription",primaryText:"heroPrimaryText",secondaryText:"heroSecondaryText",secondaryUrl:"heroSecondaryUrl"}))el(id).value=h[field]||"";
    renderSiteImage();renderAreas();renderSitePreview();
  }
  function renderSitePreview(){
    // Misma regla que la web: vacío significa vacío, nunca texto de ejemplo.
    const value=id=>el(id).value;
    const line1=value("heroLine1"),line2=value("heroLine2"),accent=value("heroAccent");
    const showSecond=Boolean(line1&&(line2||accent));
    el("sitePreviewKicker").textContent=value("heroKicker");
    el("sitePreviewKicker").hidden=!value("heroKicker");
    el("sitePreviewLine1").textContent=line1;
    el("sitePreviewBreak").hidden=!showSecond;
    el("sitePreviewLine2").textContent=line2;
    el("sitePreviewAccent").textContent=accent?(line2.trim()?" ":"")+accent:"";
    el("sitePreviewAccent").hidden=!accent;
    el("sitePreviewStar").hidden=!(line1||line2||accent);
    el("sitePreviewDescription").textContent=value("heroDescription");
    el("sitePreviewDescription").hidden=!value("heroDescription");
    el("sitePreviewPrimary").textContent=value("heroPrimaryText");
    el("sitePreviewPrimary").hidden=!value("heroPrimaryText");
    el("sitePreviewSecondary").textContent=value("heroSecondaryText");
    el("sitePreviewSecondary").hidden=!value("heroSecondaryText");
  }
  function renderSiteImage(){
    const path=state.site.hero.image||"";
    el("heroImageLabel").textContent=state.siteImageFile?`Imagen nueva: ${state.siteImageFile.name}`:path?`Imagen existente: ${path}`:"Se mostrará la ilustración original de la portada";
    const img=el("heroImagePreview");
    if(img.dataset.blob){URL.revokeObjectURL(img.dataset.blob);delete img.dataset.blob;}
    if(state.siteImageFile){img.src=URL.createObjectURL(state.siteImageFile);img.dataset.blob=img.src;img.hidden=false;}
    else if(path){img.src=assetUrl(path);img.hidden=false;}
    else {img.removeAttribute("src");img.hidden=true;}
  }
  function renderAreas(){
    const items=state.site.areasOrder;
    el("siteAreaOrder").innerHTML=items.map((name,i)=>`<div class="site-area-item"><span>${esc(name)}</span><button type="button" class="mini-btn" data-area-up="${i}" ${i===0?"disabled":""}>↑</button><button type="button" class="mini-btn" data-area-down="${i}" ${i===items.length-1?"disabled":""}>↓</button></div>`).join("");
  }
  async function saveSite(event){
    event.preventDefault();if(state.busy)return;
    state.busy=true;status("siteStatus","Verificando portada en GitHub…");
    try{
      const remote=await readJson(SITE_PATH,defaultSite());
      if(JSON.stringify(remote)!==state.siteBaseline)throw Error("La portada fue modificada desde otra sesión. Recarga la versión de GitHub antes de continuar.");
      const hero={};for(const [field,id] of Object.entries({kicker:"heroKicker",line1:"heroLine1",line2:"heroLine2",accent:"heroAccent",description:"heroDescription",primaryText:"heroPrimaryText",secondaryText:"heroSecondaryText",secondaryUrl:"heroSecondaryUrl"}))hero[field]=normalize(el(id).value);
      if(!/^https:\/\/[^\s<>"']+$/i.test(hero.secondaryUrl))throw Error("El segundo enlace debe empezar por https://");
      hero.image=state.site.hero.image||"";
      const changes=[];
      if(state.siteImageFile){
        if(state.siteImageFile.size>10*1024*1024)throw Error("La imagen supera los 10 MB.");
        hero.image=`assets/biblioteca/portada-${Date.now().toString(36)}.webp`;
        const converted=await convertToWebp(state.siteImageFile);
        changes.push({path:hero.image,sha:await createGitBlob(converted)});
      }
      const saved={version:1,hero,areasOrder:state.site.areasOrder};
      changes.push({path:SITE_PATH,sha:await createGitBlob(JSON.stringify(saved,null,2)+"\n")});
      await atomicCommit(changes,"Actualizar portada de TecnologíaInsti");
      state.site=saved;state.siteBaseline=JSON.stringify(saved);state.siteImageFile=null;fillSite();
      status("siteStatus","Portada guardada. Los cambios aparecerán al actualizar la web.","success");
    }catch(e){status("siteStatus",errMessage(e),"error");}finally{state.busy=false;}
  }
  // ========= Videotutoriales manuales =========
  const emptyVideos=()=>({version:1,videos:[]});
  async function loadManualVideos(){
    const doc=await readJson(VIDEOS_PATH,emptyVideos());
    if(!Array.isArray(doc.videos))throw Error("El archivo de vídeos manuales no es válido.");
    state.manualVideos=doc.videos;state.videoBaseline=JSON.stringify(doc);renderManualVideos();
    status("videoStatus",`${doc.videos.length} vídeos manuales guardados en GitHub.`,"success");
  }
  function extractYoutubeId(value){
    try{const url=new URL(value);const host=url.hostname.replace(/^www\./,"");
      if(!["youtube.com","m.youtube.com","youtu.be","youtube-nocookie.com"].includes(host))return "";
      const id=host==="youtu.be"?url.pathname.slice(1):url.searchParams.get("v")||(url.pathname.match(/^\/(?:shorts|live|embed)\/([a-zA-Z0-9_-]{11})/)||[])[1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id||"")?id:"";
    }catch{return "";}
  }
  function renderManualVideos(){
    el("manualVideoList").innerHTML=state.manualVideos.map(v=>`<div class="manual-video-item" data-vid="${esc(v.id)}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" /><div><strong>${esc(v.title_es||v.title||"Videotutorial")}</strong><br /><small>${esc(v.category)} · ${esc(v.created||"Sin fecha")} · ${v.enabled===false?"Oculto":v.publishAt&&Date.parse(v.publishAt)>Date.now()?"Programado":"Visible"}</small></div><div class="post-actions"><button type="button" class="btn secondary" data-v-edit="${esc(v.id)}">Editar</button><button type="button" class="btn danger" data-v-delete="${esc(v.id)}">Eliminar</button></div></div>`).join("")||'<p class="empty">Todavía no has añadido vídeos manualmente. Los vídeos de tus listas seguirán sincronizándose como antes.</p>';
  }
  function editVideo(id=null){
    const video=state.manualVideos.find(v=>v.id===id)||{};
    state.videoEditingId=id;
    el("videoFormTitle").textContent=id?"Editar videotutorial":"Nuevo videotutorial";
    el("videoUrl").value=id?"https://www.youtube.com/watch?v="+id:"";
    el("videoUrl").readOnly=!!id;
    el("videoTitle").value=video.title_es||video.title||"";
    el("videoDescription").value=video.description_es||"";
    el("videoCategory").value=video.category||"Videotutoriales IA";
    el("videoDate").value=video.created||localDate();
    el("videoTags").value=(video.tags||[]).join(", ");
    el("videoThumb").value=video.customThumbnail||"";
    el("videoPublishMode").value=video.enabled===false?"draft":video.publishAt&&Date.parse(video.publishAt)>Date.now()?"scheduled":"now";
    el("videoSchedule").value=toMadridLocal(video.publishAt);toggleSchedule("video");
    el("videoForm").hidden=false;el("videoForm").scrollIntoView({block:"start"});
  }
  async function saveVideo(event){
    event.preventDefault();if(state.busy)return;
    const id=extractYoutubeId(el("videoUrl").value);
    if(!id){status("videoStatus","Introduce un enlace válido de un vídeo de YouTube (no una lista de reproducción).","error");return;}
    const title=normalize(el("videoTitle").value),description=normalize(el("videoDescription").value);
    if(!title){status("videoStatus","Introduce un título en español.","error");return;}
    const thumb=normalize(el("videoThumb").value);
    if(thumb && !/^https:\/\/[^\s<>"']+$/i.test(thumb)){status("videoStatus","La miniatura debe ser una dirección https:// válida.","error");return;}
    state.busy=true;status("videoStatus","Verificando vídeos en GitHub…");
    try{
      const remote=await readJson(VIDEOS_PATH,emptyVideos());
      if(JSON.stringify(remote)!==state.videoBaseline)throw Error("El catálogo de vídeos cambió en GitHub. Pulsa Actualizar vídeos antes de editar.");
      const mode=el("videoPublishMode").value;
      const old=remote.videos.find(v=>v.id===id)||{};
      const video={...old,id,category:el("videoCategory").value,title,title_es:title,description_es:description,created:el("videoDate").value||localDate(),tags:parseTags(el("videoTags").value),enabled:mode!=="draft",title_es_verified:true,description_es_verified:true,
        thumbnail:thumb||"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg",customThumbnail:thumb};
      if(mode==="scheduled")video.publishAt=madridToUTC(el("videoSchedule").value);else delete video.publishAt;
      remote.videos=(remote.videos||[]).filter(v=>v.id!==id);remote.videos.push(video);remote.updatedAt=new Date().toISOString();
      await saveJsonAtomic(VIDEOS_PATH,remote,`Guardar videotutorial: ${title.slice(0,70)}`);
      state.manualVideos=remote.videos;state.videoBaseline=JSON.stringify(remote);renderManualVideos();el("videoForm").hidden=true;
      status("videoStatus","Vídeo guardado en GitHub. La ficha aparecerá en su sección y en Novedades.","success");
    }catch(e){status("videoStatus",errMessage(e),"error");}finally{state.busy=false;}
  }
  async function deleteVideo(id){
    const video=state.manualVideos.find(v=>v.id===id);if(!video||!confirm(`¿Eliminar del catálogo manual el vídeo «${video.title_es||video.title}»?\n\nSi también está en una lista automática puede seguir apareciendo desde esa lista.`))return;
    state.busy=true;
    try{const remote=await readJson(VIDEOS_PATH,emptyVideos());
      if(JSON.stringify(remote)!==state.videoBaseline)throw Error("El catálogo cambió en GitHub; recárgalo.");
      remote.videos=remote.videos.filter(v=>v.id!==id);remote.updatedAt=new Date().toISOString();
      await saveJsonAtomic(VIDEOS_PATH,remote,"Eliminar videotutorial del catálogo manual");
      state.manualVideos=remote.videos;state.videoBaseline=JSON.stringify(remote);renderManualVideos();status("videoStatus","Vídeo eliminado del catálogo manual.","success");
    }catch(e){status("videoStatus",errMessage(e),"error");}finally{state.busy=false;}
  }
  function bind() {
    el("tabPosts").addEventListener("click",()=>switchTab("posts"));
    el("tabMenus").addEventListener("click",()=>switchTab("menus"));
    el("tabMedia").addEventListener("click",()=>switchTab("media"));
    el("tabSite").addEventListener("click",()=>switchTab("site"));
    el("tabVideos").addEventListener("click",()=>switchTab("videos"));
    for(const id of ["filterStatus","filterCategory","filterTag","filterFrom","filterTo"]){
      el(id).addEventListener("change",renderList);
      if(id==="filterTag")el(id).addEventListener("input",renderList);
    }
    el("postPublishMode").addEventListener("change",()=>toggleSchedule("post"));
    el("videoPublishMode").addEventListener("change",()=>toggleSchedule("video"));
    el("chooseLibraryImages").addEventListener("click",()=>openMediaPicker("image"));
    el("chooseLibraryDocument").addEventListener("click",()=>openMediaPicker("document"));
    el("removeSelectedDoc").addEventListener("click",()=>{
      state.selectedDoc=null;el("removeSelectedDoc").hidden=true;el("selectedDocumentLabel").textContent="";
    });
    el("mediaPickerClose").addEventListener("click",()=>el("mediaPicker").close());
    el("mediaPickerSearch").addEventListener("input",renderMediaPicker);
    el("mediaPickerGrid").addEventListener("click",e=>{
      const button=e.target.closest("[data-library-use]");if(button)useMedia(button.dataset.libraryUse);
    });
    el("mediaPickerMore").addEventListener("click",()=>{state.libraryLimit+=48;renderMediaPicker();});
    el("mediaSearch").addEventListener("input",()=>{state.libraryLimit=48;renderMediaLibrary();});
    el("mediaType").addEventListener("change",()=>{state.libraryLimit=48;renderMediaLibrary();});
    el("mediaReload").addEventListener("click",()=>loadLibrary().catch(e=>status("mediaStatus",errMessage(e),"error")));
    el("mediaMore").addEventListener("click",()=>{state.libraryLimit+=48;renderMediaLibrary();});
    el("mediaUploadInput").addEventListener("change",e=>uploadMedia([...e.target.files]));
    el("mediaGrid").addEventListener("click",e=>{
      const button=e.target.closest("[data-library-copy]");if(!button)return;
      const value=button.dataset.libraryCopy;
      navigator.clipboard?.writeText(value).then(()=>status("mediaStatus","Ruta copiada: "+value,"success")).catch(()=>prompt("Copia la ruta:",value)) || prompt("Copia la ruta:",value);
    });
    el("siteForm").addEventListener("submit",saveSite);
    el("siteForm").addEventListener("input",renderSitePreview);
    el("siteReload").addEventListener("click",()=>loadSite().catch(e=>status("siteStatus",errMessage(e),"error")));
    el("chooseHeroImage").addEventListener("click",()=>openMediaPicker("hero"));
    el("heroRemoveImage").addEventListener("click",()=>{state.site.hero.image="";state.siteImageFile=null;el("heroImageUpload").value="";renderSiteImage();});
    el("heroImageUpload").addEventListener("change",e=>{state.siteImageFile=e.target.files[0]||null;renderSiteImage();});
    el("siteAreaOrder").addEventListener("click",e=>{
      const up=e.target.closest("[data-area-up]"),down=e.target.closest("[data-area-down]");if(!up&&!down)return;
      const at=Number((up||down).dataset[up?"areaUp":"areaDown"]),to=at+(up?-1:1);
      if(to<0||to>=state.site.areasOrder.length)return;
      [state.site.areasOrder[at],state.site.areasOrder[to]]=[state.site.areasOrder[to],state.site.areasOrder[at]];renderAreas();
    });
    el("videoAdd").addEventListener("click",()=>editVideo());
    el("videoReload").addEventListener("click",()=>loadManualVideos().catch(e=>status("videoStatus",errMessage(e),"error")));
    el("manualVideoList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-v-edit]"),remove=e.target.closest("[data-v-delete]");
      if(edit)editVideo(edit.dataset.vEdit);if(remove)deleteVideo(remove.dataset.vDelete);
    });
    el("videoCancel").addEventListener("click",()=>el("videoForm").hidden=true);
    el("videoForm").addEventListener("submit",saveVideo);
    el("menuAddTop").addEventListener("click",()=>openMenuForm());
    el("menuAddChild").addEventListener("click",()=>openMenuForm(null,state.menu.items[0]?.id||""));
    el("menuTree").addEventListener("click",e=>{
      const button=e.target.closest("[data-action]");if(!button)return;
      const id=button.closest("[data-mid]")?.dataset.mid;if(!id)return;
      const action=button.dataset.action;
      if(action==="edit")openMenuForm(id);
      else if(action==="add-child")openMenuForm(null,id);
      else if(action==="remove")deleteMenuItem(id);
      else if(action==="up"||action==="down")moveMenuItem(id,action==="up"?-1:1);
    });
    el("menuType").addEventListener("change",()=>{
      const type=el("menuType").value;
      el("menuValue").placeholder=type==="filter"?"Categoría de publicaciones":type==="page"?"cuaderno-seneca.html":"https://ejemplo.com/";
    });
    el("menuLabel").addEventListener("input",()=>{
      if(!state.menuEditId&&el("menuType").value==="filter"&&(!el("menuValue").value||el("menuValue").dataset.auto==="1")){
        el("menuValue").value=el("menuLabel").value;el("menuValue").dataset.auto="1";
      }
    });
    el("menuValue").addEventListener("input",()=>{el("menuValue").dataset.auto="0"});
    el("menuCancel").addEventListener("click",closeMenuForm);
    el("menuItemForm").addEventListener("submit",applyMenuItem);
    el("menuSave").addEventListener("click",saveMenu);
    el("menuReset").addEventListener("click",reloadMenu);
    el("loginForm").addEventListener("submit",connect);
    el("signOut").addEventListener("click",signOut);
    el("newPost").addEventListener("click",()=>{switchTab("posts");newEditor();});
    el("reloadPosts").addEventListener("click",async()=>{
      const button=el("reloadPosts");button.disabled=true;
      try{await refreshPosts();}catch(e){alert(errMessage(e));}
      finally{button.disabled=false;}
    });
    el("searchPosts").addEventListener("input",renderList);
    el("postCategory").addEventListener("change",explainCategory);
    el("refreshCategories").addEventListener("click",async()=>{
      const button=el("refreshCategories");button.disabled=true;
      try{await syncMenuCategories();}
      catch(e){alert("No se pudieron actualizar los apartados de GitHub. "+errMessage(e));}
      finally{button.disabled=false;}
    });
    el("postList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"),remove=e.target.closest("[data-remove]");
      if(edit)newEditor(edit.dataset.edit);
      if(remove)deletePost(remove.dataset.remove);
    });
    el("cancelEdit").addEventListener("click",closeEditor);
    el("cancelEditBottom").addEventListener("click",closeEditor);
    el("addLink").addEventListener("click",()=>addLinkRow());
    el("postForm").addEventListener("submit",savePost);
    el("postContent").addEventListener("input",updatePostPreview);
    el("postToolbar").addEventListener("pointerdown",e=>{if(e.target.closest("button"))e.preventDefault();});
    el("postToolbar").addEventListener("click",e=>{
      const button=e.target.closest("[data-format]");if(button)formatPostText(button.dataset.format);
    });
    el("postContent").addEventListener("keydown",e=>{
      if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
      const commands={b:'bold',i:'italic',k:'link'};
      if(commands[e.key.toLowerCase()]){e.preventDefault();formatPostText(commands[e.key.toLowerCase()]);}
    });
    el("photoInput").addEventListener("change",e=>{addImages([...e.target.files]);e.target.value="";});
    const drop=el("imageDrop");
    drop.addEventListener("dragover",e=>{e.preventDefault();drop.style.borderColor="#0aa896";});
    drop.addEventListener("dragleave",()=>{drop.style.borderColor="";});
    drop.addEventListener("drop",e=>{e.preventDefault();drop.style.borderColor="";addImages([...e.dataTransfer.files]);});
    el("gallery").addEventListener("click",e=>{
      const btn=e.target.closest("[data-move]");if(!btn)return;
      const index=Number(btn.closest("[data-i]").dataset.i),move=btn.dataset.move;
      if(move==="remove"){
        const removed=state.media.splice(index,1)[0];if(removed.file&&removed.url)URL.revokeObjectURL(removed.url);
      }else{
        const swap=move==="up"?index-1:index+1;
        if(swap<0||swap>=state.media.length)return;
        [state.media[index],state.media[swap]]=[state.media[swap],state.media[index]];
      }
      renderMedia();
    });
    el("attachmentInput").addEventListener("change",e=>{
      state.uploadingDoc=e.target.files[0]||null;
      if(state.uploadingDoc){state.selectedDoc=null;el("selectedDocumentLabel").textContent="";el("removeSelectedDoc").hidden=true;}
    });
  }
  bind();
})();

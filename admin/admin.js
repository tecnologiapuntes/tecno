"use strict";
// TecnologíaInsti · Panel GitHub V44. Sin servicios externos ni contraseña almacenada.
(() => {
  const OWNER = "tecnologiapuntes";
  const REPO = "tecno";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const POSTS_PATH = "assets/posts.js";
  const CMS_PATH = "assets/cms-posts.json";
  const MENU_PATH = "assets/cms-menu.json";
  const menuCore = window.TI_MENU;
  const root = document;
  const el = (id) => root.getElementById(id);
  const state = {
    token: null, login: null, branch: "main", posts: [], editingId: null,
    original: null, media: [], uploadingDoc: null, busy: false,
    menu: menuCore.normalize(menuCore.defaults), menuBaseline: null, menuEditId: null, menuNextParent: "", activeTab: "posts"
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
    if (/^assets\/[a-z0-9_./-]+$/i.test(src) && !src.includes("..")) return new URL("../" + src, location.href).href;
    if (/^https:\/\//.test(src)) return src;
    return new URL("../assets/logo-tecnologiainsti.webp", location.href).href;
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
    // Legacy categories remain editable, including posts from previous versions.
    for(const p of state.posts) if(p.category&&!list.some(x=>x.value===p.category))list.push({value:p.category,label:p.category+" (existente)"});
    if(!list.length)list.push({value:"Prompts",label:"Prompts"});
    cat.replaceChildren(...list.map(({value,label})=>new Option(label,value)));
    if([...cat.options].some(o=>o.value===prior))cat.value=prior;
  }
  async function latestData() {
    const [legacy,cms]=await Promise.all([readRemotePosts(),readRemoteCms()]);
    return {legacy,cms,combined:mergePosts(legacy,cms)};
  }
  async function refreshPosts() {
    const latest=await latestData();
    state.posts=latest.combined;
    fillCategories();
    renderList();
  }
  function renderList() {
    const posts = [...state.posts].sort((a,b)=>String(b.created||"").localeCompare(String(a.created||"")));
    el("totalCount").textContent=String(posts.length);
    el("publishedCount").textContent=String(posts.filter(p=>p.published).length);
    el("draftCount").textContent=String(posts.filter(p=>!p.published).length);
    const q=normalize(el("searchPosts").value).toLowerCase();
    const filtered=posts.filter(p=>[p.title,p.category,p.created,p.excerpt].join(" ").toLowerCase().includes(q));
    const container=el("postList");
    if(!filtered.length){container.innerHTML='<div class="empty">No hay publicaciones con ese término.</div>';return;}
    container.innerHTML=filtered.map(p=>`<article class="post-row" data-id="${esc(p.id)}">
      <img class="post-thumb" src="${esc(assetUrl(p.image))}" loading="lazy" alt="" />
      <div class="post-text"><h3>${esc(short(p.title,150))}${p.published?"":'<span>BORRADOR</span>'}</h3><p>${esc(p.category)} · ${esc(p.created||"Sin fecha")}</p></div>
      <div class="post-actions"><button class="btn secondary" type="button" data-edit="${esc(p.id)}">Editar</button><button type="button" class="btn danger" data-remove="${esc(p.id)}">Eliminar</button></div>
    </article>`).join("");
  }
  function releasePreviews() {
    for (const media of state.media) if (media.url && media.file) URL.revokeObjectURL(media.url);
    state.media=[];
  }
  function newEditor(id=null) {
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
    category.value=p.category || (category.options[0]?.value || "Prompts");
    el("postDate").value=p.created || localDate();
    el("postExcerpt").value=p.excerpt || "";
    el("postContent").value=p.content || "";
    el("postPublished").checked=p.published !== 0;
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
    const category=el("postCategory").value,created=el("postDate").value;
    if(!title||!content||!created) {status("saveStatus","Completa el título, la fecha y el texto.","error");return;}
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
      if(!excerpt)excerpt=content.replace(/\s+/g," ").slice(0,230);
      const newPost={
        ...(old||{}),id,title,category,excerpt,created,content,sourceLinks:links,
        published:el("postPublished").checked?1:0,
        image:imagePaths[0]||""
      };
      if(imagePaths.length>1)newPost.images=imagePaths;
      else delete newPost.images;
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
      state.menu=await readRemoteMenu();
      state.menuBaseline=JSON.stringify(state.menu);
      fillCategories();
      renderMenuTree();
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
    el("workspace").hidden=true;el("loginPanel").hidden=false;el("accountLabel").hidden=true;el("signOut").hidden=true;
    el("token").value="";
    status("loginMessage","Sesión cerrada. Tu token no se ha guardado.","success");
  }

  function switchTab(tab){
    if(state.busy)return;
    state.activeTab=tab;
    el("tabPosts").classList.toggle("active",tab==="posts");
    el("tabMenus").classList.toggle("active",tab==="menus");
    el("tabPosts").setAttribute("aria-selected",String(tab==="posts"));
    el("tabMenus").setAttribute("aria-selected",String(tab==="menus"));
    el("editorPanel").hidden=true;
    el("listPanel").hidden=tab!=="posts";
    el("menuPanel").hidden=tab!=="menus";
    if(tab==="menus")renderMenuTree();
  }
  function findMenuItem(id){
    for(const group of state.menu.items){
      if(group.id===id)return {item:group,parent:null,list:state.menu.items};
      for(const child of group.children||[])if(child.id===id)return {item:child,parent:group,list:group.children};
    }
    return null;
  }
  function drawMenuChildren(group){
    return (group.children||[]).map((child,index)=>`<div class="menu-node child" data-mid="${esc(child.id)}">
      <div class="menu-node-text"><strong>${esc(child.label)}</strong><small>${child.type==="filter"?"Publicaciones: "+esc(child.value):child.type==="page"?"Página: "+esc(child.value):"Enlace externo"}</small></div>
      <div class="menu-node-actions"><button type="button" data-action="up" title="Subir" ${index===0?"disabled":""}>↑</button><button type="button" data-action="down" title="Bajar" ${index===group.children.length-1?"disabled":""}>↓</button><button type="button" data-action="edit">Editar</button><button type="button" data-action="remove" title="Eliminar subapartado">✕</button></div>
    </div>`).join("");
  }
  function renderMenuTree(){
    const box=el("menuTree");
    box.innerHTML=state.menu.items.map((item,index)=>`<section class="menu-group-card" data-mid="${esc(item.id)}">
      <div class="menu-node main"><div class="menu-node-text"><strong>${esc(item.label)}</strong><small>${item.type==="filter"?"Categoría principal":item.type==="page"?"Página interna":"Enlace externo"}${item.children.length?" · "+item.children.length+" subapartados":""}</small></div>
      <div class="menu-node-actions"><button type="button" data-action="up" title="Subir" ${index===0?"disabled":""}>↑</button><button type="button" data-action="down" title="Bajar" ${index===state.menu.items.length-1?"disabled":""}>↓</button><button type="button" data-action="add-child">+ Subapartado</button><button type="button" data-action="edit">Editar</button><button type="button" data-action="remove" title="Eliminar apartado">✕</button></div></div>
      <div class="menu-children">${drawMenuChildren(item)}</div>
    </section>`).join("");
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
    select.replaceChildren(new Option("Barra principal (apartado)",""),...state.menu.items.filter(x=>x.id!==id).map(x=>new Option("Dentro de "+x.label,x.id)));
    select.value=found?.parent?.id||parentId||"";
    el("menuLabel").value=item.label||"";
    el("menuType").value=item.type||"filter";
    el("menuValue").value=item.value||"";
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
    const affected=found.parent?"este subapartado":"este apartado y sus subapartados";
    if(!confirm(`¿Eliminar ${affected}: «${found.item.label}»?\n\nLas publicaciones se conservarán, pero dejarán de tener ese enlace en el menú.`))return;
    found.list.splice(found.list.findIndex(x=>x.id===id),1);
    closeMenuForm();renderMenuTree();fillCategories();
  }
  function applyMenuItem(event){
    event.preventDefault();
    const label=normalize(el("menuLabel").value),type=el("menuType").value;
    const value=normalize(el("menuValue").value)|| (type==="filter"?label:"");
    const description=normalize(el("menuDescription").value);
    const parentId=el("menuParent").value;
    if(!label||!value){alert("Rellena el nombre y el destino.");return;}
    if(type==="url"&&!menuCore.validUrl(value)){alert("El enlace externo debe empezar por https:// y no contener espacios.");return;}
    if(type==="page"&&!menuCore.validPage(value)){alert("Escribe una página interna válida, por ejemplo cuaderno-seneca.html");return;}
    if(parentId&&!state.menu.items.some(x=>x.id===parentId)){alert("El apartado principal seleccionado ya no existe.");return;}
    const found=state.menuEditId?findMenuItem(state.menuEditId):null;
    if(found && parentId && (found.item.children||[]).length){
      alert("Este apartado tiene subapartados. Antes de convertirlo en subapartado, mueve o elimina sus elementos para no perderlos.");return;
    }
    const originalIndex=found?found.list.findIndex(x=>x.id===found.item.id):-1;
    const sameParent=!!found && (found.parent?.id||"")===parentId;
    if(found)found.list.splice(originalIndex,1);
    const item=found?.item||{id:"nav-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),children:[]};
    Object.assign(item,{label,type,value});
    if(parentId){
      delete item.children;delete item.description;
      const list=state.menu.items.find(x=>x.id===parentId).children;
      if(sameParent)list.splice(originalIndex,0,item);else list.push(item);
    }
    else {
      item.description=description;item.children=item.children||[];
      if(sameParent)state.menu.items.splice(originalIndex,0,item);else state.menu.items.push(item);
    }
    state.menu=menuCore.normalize(state.menu);
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

  function bind() {
    el("tabPosts").addEventListener("click",()=>switchTab("posts"));
    el("tabMenus").addEventListener("click",()=>switchTab("menus"));
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
    el("postList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"),remove=e.target.closest("[data-remove]");
      if(edit)newEditor(edit.dataset.edit);
      if(remove)deletePost(remove.dataset.remove);
    });
    el("cancelEdit").addEventListener("click",closeEditor);
    el("cancelEditBottom").addEventListener("click",closeEditor);
    el("addLink").addEventListener("click",()=>addLinkRow());
    el("postForm").addEventListener("submit",savePost);
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
    el("attachmentInput").addEventListener("change",e=>{state.uploadingDoc=e.target.files[0]||null;});
  }
  bind();
})();

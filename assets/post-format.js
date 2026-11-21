"use strict";
// TecnologiaInsti V52 - formato de texto seguro compartido entre las paginas y el editor.
// El contenido sigue siendo texto (Markdown basico); no se ejecuta HTML del usuario.
(() => {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function inline(source) {
    const links=[];
    // Sustituir solo enlaces http(s) validos y almacenar el HTML seguro aparte.
    let s=String(source??"").replace(/\[([^\]\n]{1,160})\]\((https?:\/\/[^\s<>()"']{1,2000})\)/g,(all,label,url)=>{
      try {
        const parsed=new URL(url);
        if(!["https:","http:"].includes(parsed.protocol))return all;
        links.push('<a href="'+escape(parsed.href)+'" target="_blank" rel="noopener noreferrer">'+escape(label)+'</a>');
        return '\u0002'+(links.length-1)+'\u0003';
      }catch{return all}
    });
    s=escape(s);
    // Formato intencionalmente limitado: no admitir etiquetas HTML del texto original.
    s=s.replace(/\*\*\*([^\n*]+?)\*\*\*/g,'<strong><em>$1</em></strong>')
      .replace(/\*\*([^\n*]+?)\*\*/g,'<strong>$1</strong>')
      .replace(/(?<!\*)\*([^\n*]+?)\*(?!\*)/g,'<em>$1</em>')
      .replace(/\+\+([^\n+]+?)\+\+/g,'<u>$1</u>')
      .replace(/~~([^\n~]+?)~~/g,'<del>$1</del>');
    return s.replace(/\u0002(\d+)\u0003/g,(_,index)=>links[Number(index)] || '');
  }
  function format(value) {
    const source=String(value??'').replace(/\r\n?/g,'\n').trim();
    if(!source)return '';
    const lines=source.split('\n');
    let out='', list=null;
    const close=()=>{if(list){out+='</'+list+'>';list=null}};
    for(const raw of lines){
      const line=raw.trim();
      if(!line){close();continue}
      const bullet=line.match(/^(?:•|[-*])\s+(.+)$/);
      const numbered=line.match(/^\d{1,3}[.)]\s+(.+)$/);
      if(bullet||numbered){
        const kind=bullet?'ul':'ol';
        if(list!==kind){close();out+='<'+kind+'>';list=kind}
        out+='<li>'+inline(bullet?bullet[1]:numbered[1])+'</li>';
        continue;
      }
      close();
      const heading=line.match(/^(#{2,3})\s+(.+)$/);
      if(heading){const level=heading[1].length;out+='<h'+level+'>'+inline(heading[2])+'</h'+level+'>';continue}
      // Compatibilidad: encabezados de las publicaciones antiguas, en mayusculas.
      const legacyTitle=line.length<=85 && /^[A-ZÁÉÍÓÚÜÑ0-9\s·:—–\-«»¿?¡!(),.]+$/.test(line) && /[A-ZÁÉÍÓÚÜÑ]/.test(line);
      out+=legacyTitle?'<h3>'+inline(line)+'</h3>':'<p>'+inline(line)+'</p>';
    }
    close();return out;
  }
  function plain(value){
    return String(value??'').replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g,'$1')
      .replace(/^\s*#{2,3}\s+/gm,'').replace(/(\*\*\*|\*\*|\*|\+\+|~~)/g,'').replace(/\s+/g,' ').trim();
  }
  window.TI_POST_FORMAT=Object.freeze({format,plain});
})();

#!/usr/bin/env python3
"""V49: sincroniza títulos y descripciones en español sin afectar a Séneca ni posts.

Si el acceso a YouTube falla, conserva los datos previos. Si solo el RSS
responde, no reemplaza una lista completa con el subconjunto de 15 elementos.
"""
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

# Si se pierde el acceso a YouTube, se siguen traduciendo las fichas
# previamente sincronizadas, sin reescribir ni inventar sus metadatos.
SPANISH_TOKENS = set('el la los las un una que de del al con sin para como cómo tus sus este esta esto los más por entre en usa crea crear aprende utilizar sobre profesor profesora profesorado alumnado clase aula educación tecnología no sí además quieres tendrás podemos cuando donde guía vídeo infografía infografías herramienta herramientas actividades clase'.split())
ENGLISH_TOKENS = set('the a an and for from with without how what why your this these those that you can using use learn about tutorial tutorials beginners best tips guide create build to be will it new top tools are on in at or by of get started must should'.split())
ENGLISH_PHRASES = re.compile(r'\b(?:how to|in this video|in this tutorial|step by step|learn how|the best|this tool|for teachers|what is|why you|you can|you will|in order to|watch this|download the|getting started|find out|subscribe to)\b',re.I)

def classify_language(text):
    """Spanish, other, or uncertain. Brands and links are ignored."""
    import unicodedata
    clean=re.sub(r'https?://\S+|www\.\S+|#[\w-]+|@\w+', ' ', text or '')
    words=[w.lower() for w in re.findall(r"[a-záéíóúñü]+",clean,re.I)]
    if ENGLISH_PHRASES.search(clean):return 'other'
    s=sum(w in SPANISH_TOKENS for w in words)
    e=sum(w in ENGLISH_TOKENS for w in words)
    # Typical mix of software brand names and Spanish words: keep Spanish.
    if s>=2 and s>=e:return 'es'
    if e>=2 and e>s:return 'other'
    if re.search(r'[¿¡áéíóúñ]',clean,re.I) and s>=1:return 'es'
    try:
        from langdetect import detect_langs
        scores=detect_langs(clean[:3500])
        if scores and scores[0].lang=='es' and scores[0].prob>0.75:return 'es'
        if scores and scores[0].lang!='es' and scores[0].prob>0.72:return 'other'
    except Exception: pass
    return 'uncertain'


def translate_spanish(text, label):
    """Translate complete text (split safely), preserve URLs and never invent it."""
    text=str(text or '').strip()
    if not text:return ''
    if classify_language(text)=='es':
        nonempty=[part for part in text.splitlines() if len(part.strip())>20 and not part.strip().startswith('http')]
        if not any(classify_language(part)=='other' for part in nonempty):return text
    try:
        from deep_translator import GoogleTranslator
        translator=GoogleTranslator(source='auto',target='es')
        # Split long descriptions into full lines/blocks, never cut URLs.
        pieces=[]
        for line in text.splitlines(keepends=True):
            if len(line)<=3500:
                pieces.append(line)
            else:
                # Whitespace boundaries avoid cutting words in half.
                remaining=line
                while len(remaining)>3500:
                    split_at=remaining.rfind(' ',0,3400)
                    if split_at<800:split_at=3400
                    pieces.append(remaining[:split_at]);remaining=remaining[split_at:]
                if remaining:pieces.append(remaining)
        if not pieces:return ''
        out=[]
        for item in pieces:
            if not item.strip() or re.fullmatch(r'\s*https?://\S+\s*',item):
                out.append(item);continue
            translated=translator.translate(item.strip())
            if not translated:raise ValueError('Traducción vacía')
            # Preserve paragraph structure.
            out.append(('\n' if item.startswith('\n') else '')+translated+('\n' if item.endswith('\n') else ''))
        result=''.join(out).strip()
        if classify_language(result)=='other':
            print(f'La traducción de {label} sigue sin estar en español.')
            return ''
        return result
    except Exception as exc:
        print(f'Traducción no disponible ({label}): {str(exc)[:180]}')
        return ''


def add_spanish_fields(entries, old):
    previous={v['id']:v for v in old.get('videos',[]) if isinstance(v,dict) and v.get('id')}
    for video in entries:
        prev=previous.get(video['id'],{})
        for field in ('title','description'):
            source=str(video.get(field) or '').strip()
            translated_key=field+'_es'
            status_key=field+'_es_verified'
            if not source:
                video[translated_key]=''
                video[status_key]=False
                continue
            old_trans=str(prev.get(translated_key) or '').strip()
            valid_old=(prev.get(field)==source and old_trans and classify_language(old_trans)!='other')
            translated=old_trans if valid_old else translate_spanish(source,field+' '+video['id'])
            # If the translation service fails, English must never become a visible translation.
            if not translated and classify_language(source)=='es':translated=source
            video[translated_key]=translated
            video[status_key]=bool(translated) and classify_language(translated)!='other'
    return entries

PLAYLIST = 'PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj'
URL = "https://www.youtube.com/playlist?list=" + PLAYLIST
OUTPUT = Path(__file__).resolve().parents[1]/"assets"/"ia-videos.json"
ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def read_previous():
    try:
        data = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return data if data.get("playlist_id") == PLAYLIST else {"videos": []}
    except (OSError, ValueError, TypeError):
        return {"videos": []}


def identify(entry):
    val = str(entry.get("id") or entry.get("url") or entry.get("webpage_url") or "")
    if ID_RE.fullmatch(val):
        return val
    m = re.search(r"(?:v=|youtu\.be/|/shorts/)([\w-]{11})", val)
    return m.group(1) if m else None


def via_ytdlp():
    import yt_dlp
    options = {"extract_flat": "in_playlist", "quiet": True,"no_warnings": True,
        "skip_download": True, "ignoreerrors": True, "socket_timeout": 20,
        "retries": 2, "extractor_retries": 1}
    with yt_dlp.YoutubeDL(options) as ydl:
        data = ydl.extract_info(URL, download=False)
    if not data or not data.get("entries"):
        return []
    entries=[]
    for row in data["entries"]:
        if not row: continue
        vid=identify(row)
        title=str(row.get("title") or "").strip()
        if vid and title and title.lower() not in ("private video", "deleted video"):
            entries.append({"id":vid,"title":title,
                "description":str(row.get("description") or ""),
                "thumbnail":f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                "upload_date":str(row.get("upload_date") or row.get("release_date") or "")})
    return entries


def via_rss():
    request=Request("https://www.youtube.com/feeds/videos.xml?playlist_id="+PLAYLIST,
        headers={"User-Agent":"Mozilla/5.0"})
    with urlopen(request, timeout=24) as response:
        root=ET.fromstring(response.read())
    ns={"a":"http://www.w3.org/2005/Atom", "yt":"http://www.youtube.com/xml/schemas/2015",
        "media":"http://search.yahoo.com/mrss/"}
    result=[]
    for entry in root.findall("a:entry",ns):
        vid=entry.findtext("yt:videoId",namespaces=ns)
        title=entry.findtext("a:title",default="",namespaces=ns)
        if vid and ID_RE.fullmatch(vid) and title:
            result.append({"id":vid,"title":title,
                "description":entry.findtext("media:group/media:description",default="",namespaces=ns),
                "thumbnail":f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                "published_at":entry.findtext("a:published",default="",namespaces=ns)})
    return result


def enrich(entries, old):
    """Descripción por vídeo, hasta recuperar las de todos, preservando caché."""
    import yt_dlp
    previous={v["id"]:v for v in old.get("videos",[]) if isinstance(v,dict) and v.get("id")}
    opts={"quiet":True,"no_warnings":True,"noplaylist":True,
        "ignoreerrors":True,"skip_download":True,"socket_timeout":14,
        "retries":1,"extractor_retries":1}
    with yt_dlp.YoutubeDL(opts) as ydl:
        for v in entries:
            prev=previous.get(v["id"],{})
            if prev.get("description") and not v.get("description"):
                v["description"]=prev["description"]
            for field in ("upload_date","published_at"):
                if prev.get(field) and not v.get(field):v[field]=prev[field]
            # Recuperar fecha de subida incluso de vídeos cuya descripción ya está guardada.
            if not v.get("description") or not (v.get("upload_date") or v.get("published_at")):
                try:
                    data=ydl.extract_info("https://www.youtube.com/watch?v="+v["id"],download=False)
                    if data:
                        if not v.get("description"):v["description"]=str(data.get("description") or "")
                        if not (v.get("upload_date") or v.get("published_at")):
                            v["upload_date"]=str(data.get("upload_date") or data.get("release_date") or "")
                except Exception as exc:
                    print("Metadatos aún inaccesibles para",v["id"],str(exc)[:90])
            if prev.get("title_es") and prev.get("title")==v["title"]:
                v["title_es"]=prev["title_es"]
            if prev.get("description_es") and prev.get("description")==v.get("description"):
                v["description_es"]=prev["description_es"]
    return entries


def main():
    print("Lista de IA solicitada:", URL)
    old=read_previous()
    source="yt-dlp"
    reused_old_data=False
    try: rows=via_ytdlp()
    except Exception as exc:
        print("YouTube no accesible mediante yt-dlp:",str(exc)[:160]); rows=[]
    if not rows:
        try: rows=via_rss();source="RSS parcial (máximo 15)"
        except Exception as exc: print("RSS no accesible:",str(exc)[:160]);rows=[]
    if not rows:
        if not old.get('videos'):
            print("No hay datos disponibles; se conserva el listado existente.")
            return
        print("No se pudo leer YouTube; se traducirán los metadatos previamente sincronizados.")
        # Important: copy so translations do not mutate `old` in-place,
        # otherwise comparison incorrectly reports "no changes".
        rows=[dict(v) for v in old['videos']]
        source=old.get('source','Datos conservados')
        reused_old_data=True
    seen=set(); unique=[]
    for row in rows:
        if row["id"] not in seen:
            unique.append(row);seen.add(row["id"])
    if source!="yt-dlp" and len(old.get("videos",[]))>len(unique):
        print("RSS parcial: se mantiene la lista anterior más completa.")
        return
    if source=="yt-dlp" and old.get("source")=="yt-dlp" and len(unique)<len(old.get("videos",[])):
        print("YouTube devolvió menos vídeos que antes; se conserva la lista completa previa.")
        return
    if not reused_old_data:
        unique=enrich(unique,old)
    unique=add_spanish_fields(unique,old)
    for v in unique:
        # Preserve normalized keys even when blank: no placeholder masquerading as data.
        v.setdefault("description","")
    if old.get("videos")==unique:
        print("Sin cambios:",len(unique),"vídeos")
        return
    payload={"playlist_id":PLAYLIST,"playlist_title":"Videotutoriales de Inteligencia Artificial",
        "source":source,"updated_at":datetime.now(timezone.utc).isoformat(),"videos":unique}
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Actualizados",len(unique),"vídeos de IA (",source,")")

if __name__=="__main__":
    main()

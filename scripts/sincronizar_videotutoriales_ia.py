#!/usr/bin/env python3
"""Sincroniza una lista real de YouTube, sin datos simulados ni alterar Séneca.

Si el acceso a YouTube falla, conserva los datos previos. Si solo el RSS
responde, no reemplaza una lista completa con el subconjunto de 15 elementos.
"""
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

PLAYLIST = 'PL4P4xfIXfbrFFZW3sRgL3hXmBFJqIHusy'
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
                "thumbnail":f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"})
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
                "thumbnail":f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"})
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
            if not v.get("description"):
                try:
                    data=ydl.extract_info("https://www.youtube.com/watch?v="+v["id"],download=False)
                    if data:
                        v["description"]=str(data.get("description") or "")
                except Exception as exc:
                    print("Descripción aún inaccesible para",v["id"],str(exc)[:90])
            if prev.get("title_es") and prev.get("title")==v["title"]:
                v["title_es"]=prev["title_es"]
            if prev.get("description_es") and prev.get("description")==v.get("description"):
                v["description_es"]=prev["description_es"]
    return entries


def main():
    old=read_previous()
    source="yt-dlp"
    try: rows=via_ytdlp()
    except Exception as exc:
        print("YouTube no accesible mediante yt-dlp:",str(exc)[:160]); rows=[]
    if not rows:
        try: rows=via_rss();source="RSS parcial (máximo 15)"
        except Exception as exc: print("RSS no accesible:",str(exc)[:160]);rows=[]
    if not rows:
        print("No hay datos disponibles; se conserva el listado existente.")
        return
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
    unique=enrich(unique,old)
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

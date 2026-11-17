#!/usr/bin/env python3
"""Sync public YouTube playlist metadata into static JSON for GitHub Pages.

Run with Python 3 + yt-dlp. We never invent missing descriptions or videos.
Existing validated metadata is preserved if YouTube blocks fetching.
"""
import json
import os
import re
from pathlib import Path
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from urllib.request import Request, urlopen

LIST = "PL4P4xfIXfbrF57UhR4Y_El-mdtnddYcyn"
DATA_PATH = Path(__file__).resolve().parents[1] / 'assets' / 'seneca-videos.json'
URL = "https://www.youtube.com/playlist?list=" + LIST
ID_RE = re.compile(r'^[a-zA-Z0-9_-]{11}$')


def read_old():
    try:
        return json.loads(DATA_PATH.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {'playlist_id': LIST, 'playlist_title': 'Cuaderno Séneca. LOMLOE', 'videos': []}


def get_video_id(entry):
    value = str(entry.get('id') or entry.get('url') or entry.get('webpage_url') or '')
    if ID_RE.fullmatch(value):
        return value
    found = re.search(r'(?:v=|youtu\.be/|/shorts/)([\w-]{11})',value)
    return found.group(1) if found else None


def extract_via_yt_dlp():
    import yt_dlp
    opts = {'extract_flat':'in_playlist', 'quiet':True, 'no_warnings':True,
        'ignoreerrors':True, 'skip_download':True, 'socket_timeout':20,
        'retries':2, 'extractor_retries':1, 'playlistend':None}
    with yt_dlp.YoutubeDL(opts) as ydl:
        data = ydl.extract_info(URL, download=False)
    if not data or not data.get('entries'):
        return []
    result = []
    for entry in data.get('entries') or []:
        if not entry: continue
        video_id = get_video_id(entry)
        if not video_id: continue
        result.append({'id':video_id, 'title':entry.get('title') or '',
                      'description':entry.get('description') or '',
                      'thumbnail':f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg'})
    return result


def extract_via_rss():
    # RSS is a 15-item partial fallback, never represented as a complete list.
    url=f'https://www.youtube.com/feeds/videos.xml?playlist_id={LIST}'
    req=Request(url, headers={'User-Agent':'Mozilla/5.0'})
    with urlopen(req, timeout=25) as rsp:
        root=ET.fromstring(rsp.read())
    ns={'a':'http://www.w3.org/2005/Atom','yt':'http://www.youtube.com/xml/schemas/2015',
        'media':'http://search.yahoo.com/mrss/'}
    result=[]
    for e in root.findall('a:entry',ns):
        v_id=e.findtext('yt:videoId',namespaces=ns)
        if not v_id or not ID_RE.fullmatch(v_id):continue
        result.append({'id':v_id, 'title':e.findtext('a:title',default='',namespaces=ns),
            'description':e.findtext('media:group/media:description',default='',namespaces=ns),
            'thumbnail':f'https://i.ytimg.com/vi/{v_id}/hqdefault.jpg'})
    return result


def enrich_description(entries, old):
    try:
        import yt_dlp
    except ImportError:
        return entries
    old_map={v['id']:v for v in old.get('videos',[]) if isinstance(v,dict) and v.get('id')}
    opts={'quiet':True, 'no_warnings':True, 'noplaylist':True, 'ignoreerrors':True,
        'skip_download':True, 'socket_timeout':18, 'retries':1, 'extractor_retries':1}
    # Preserve exact title from playlist. Descriptions from original YouTube video pages.
    for item in entries:
        vid=item['id']
        old_v=old_map.get(vid,{})
        if old_v.get('description'):
            item['description']=old_v['description'];continue
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                meta=ydl.extract_info('https://www.youtube.com/watch?v='+vid,download=False)
            if meta:
                item['title']=item['title'] or meta.get('title','')
                item['description']=meta.get('description') or item.get('description','')
        except Exception as exc:
            print(f'No se pudo leer descripción {vid}: {str(exc)[:130]}')
    return entries


def main():
    old=read_old()
    try: rows=extract_via_yt_dlp()
    except Exception as exc:
        print('YouTube playlist temporalmente inaccesible:',str(exc)[:200]);rows=[]
    source='yt-dlp'
    if not rows:
        try: rows=extract_via_rss();source='RSS parcial (hasta 15 vídeos)'
        except Exception as exc: print('RSS no disponible:',str(exc)[:200]);rows=[]
    if not rows:
        print('Se conservan los datos anteriores. No se publican vídeos inventados.')
        return
    unique=[];seen=set()
    for item in rows:
        v_id=item['id']
        if v_id not in seen and item.get('title'):
            seen.add(v_id);unique.append(item)
    if not unique:return
    if source!='yt-dlp' and len(old.get('videos',[]))>len(unique):
        print('El RSS es parcial; conservo la lista anterior más completa.')
        return
    unique=enrich_description(unique,old)
    unique=[v for v in unique if v['title'].strip()]
    if not unique:return
    # Preserve updated_at and avoid commits if only datetime changed.
    if old.get('videos')==unique:
        print(f'Sin cambios: {len(unique)} vídeos')
        return
    output={'playlist_id':LIST,'playlist_title':'Cuaderno Séneca. LOMLOE',
        'source':source,'updated_at':datetime.now(timezone.utc).isoformat(), 'videos':unique}
    DATA_PATH.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Actualizados: {len(unique)} vídeos ({source})')

if __name__=='__main__':
    main()

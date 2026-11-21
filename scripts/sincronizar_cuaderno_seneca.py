#!/usr/bin/env python3
"""Sync public YouTube playlist metadata and Spanish display text.

Uses yt-dlp and, when available, deep-translator to translate descriptions.
Never invents video IDs, titles or descriptions. Previously translated fields
stay attached to their video IDs on the next synchronization.
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
                      'thumbnail':f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg',
                      'upload_date':str(entry.get('upload_date') or entry.get('release_date') or '')})
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
            'thumbnail':f'https://i.ytimg.com/vi/{v_id}/hqdefault.jpg',
            'published_at':e.findtext('a:published',default='',namespaces=ns)})
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
        if old_v.get('description') and not item.get('description'):
            item['description']=old_v['description']
        for field in ('upload_date','published_at'):
            if old_v.get(field) and not item.get(field):item[field]=old_v[field]
        if item.get('description') and (item.get('upload_date') or item.get('published_at')):
            continue
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                meta=ydl.extract_info('https://www.youtube.com/watch?v='+vid,download=False)
            if meta:
                item['title']=item['title'] or meta.get('title','')
                if not item.get('description'):item['description']=meta.get('description') or ''
                if not (item.get('upload_date') or item.get('published_at')):
                    item['upload_date']=str(meta.get('upload_date') or meta.get('release_date') or '')
        except Exception as exc:
            print(f'No se pudieron leer metadatos {vid}: {str(exc)[:130]}')
    return entries


# Exact subject-based translations for the known original English titles.
# Future videos are translated online when possible; translations are cached.
TITLE_RULES_ES = [
    (r'getting started|\bsetup\b', 'Primeros pasos y configuración del Cuaderno de Séneca LOMLOE'),
    (r'(evaluable|assessable) activities without creating', 'Actividades evaluables sin crear una situación de aprendizaje (SdA)'),
    (r'creation of learning situations', 'Creación de situaciones de aprendizaje (SdA)'),
    (r'(assessable|evaluable) activities from the learning standards', 'Actividades evaluables a partir de los estándares de aprendizaje'),
    (r'assess criteria without using', 'Evaluar criterios sin utilizar el cuaderno ni materiales de aprendizaje'),
    (r'exporting grades from moodle', 'Exportación de calificaciones de Moodle a Séneca'),
    (r'grading the quarter', 'Calificación del trimestre en Séneca'),
    (r'cloning assessable activities', 'Clonación de actividades evaluables (leer la descripción)'),
    (r'recovering activities|solutions for missing data', 'Recuperación de actividades y solución de datos desaparecidos'),
    (r'easy seneca extension|mass grading criteria', 'Extensión Easy Séneca: calificación masiva de criterios'),
]
TITLE_EN = re.compile(r'\b(workbook|notebook|gradebook|getting|started|setup|evaluable|assessable|activities|without|creating|learning|standards|assess|grading|grades|quarter|cloning|recovering|missing|criteria|extension|description|exporting|teacher|students|reports|configuration|importing|copying|deleting)\b',re.I)
TEXT_EN = re.compile(r'\b(you can|you will|how to|in this video|in this tutorial|the following|we show|learning standards|gradebook|this tool|evaluable activities|with the|about the|for your|from the)\b',re.I)


def translate_field(text, existing=''):
    """Best-effort translation preserving URLs. No fake translations on failure."""
    if existing and str(existing).strip():
        return str(existing).strip()
    if not text or not text.strip():
        return ''
    try:
        from deep_translator import GoogleTranslator
        trans = GoogleTranslator(source='auto',target='es')
        # The free endpoint has a per-request character limit.
        # Split on sentences/whitespace rather than splitting words in half.
        fragments=[]; src=text.strip()
        while src:
            if len(src)<=3400:
                fragments.append(src); break
            pivot=max(src.rfind('\n',0,3400),src.rfind('. ',0,3400),src.rfind(' ',0,3400))
            if pivot<1000: pivot=3400
            fragments.append(src[:pivot]);src=src[pivot:].lstrip()
        translated=[]
        for fragment in fragments:
            result=trans.translate(fragment)
            if not result: return ''
            translated.append(result)
        return '\n'.join(translated)
    except Exception as exc:
        print('Traducción no disponible:',str(exc)[:150]);return ''


def add_spanish_fields(rows, old):
    old_map={v['id']:v for v in old.get('videos',[]) if isinstance(v,dict) and v.get('id')}
    for v in rows:
        old_v=old_map.get(v['id'],{})
        src_title=v['title'].strip()
        src_desc=(v.get('description') or '').strip()
        saved_es=old_v.get('title_es','')
        if saved_es and old_v.get('title') == v['title']:
            v['title_es']=saved_es
        else:
            rule=next((es for pattern,es in TITLE_RULES_ES if re.search(pattern,src_title,re.I)),None)
            if rule: v['title_es']=rule
            elif TITLE_EN.search(src_title):
                v['title_es']=translate_field(src_title)
            else: v['title_es']=re.sub(r'^[\d.\-· ]+','',src_title)
        # A new English description must not silently reuse an old translation.
        if src_desc and old_v.get('description','')==src_desc and old_v.get('description_es'):
            v['description_es']=old_v['description_es']
        elif src_desc and TEXT_EN.search(src_desc):
            v['description_es']=translate_field(src_desc)
        else:
            v['description_es']=src_desc
    return rows


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
    unique=add_spanish_fields(unique,old)
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

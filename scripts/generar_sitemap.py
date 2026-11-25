#!/usr/bin/env python3
"""Genera sitemap.xml para TecnologíaInsti en GitHub Pages.

- No altera publicaciones ni contenidos, solo escribe sitemap.xml.
- Incluye las páginas HTML públicas y las publicaciones visibles por ?post=<id>.
- Excluye borradores, publicaciones programadas aún no visibles y hiddenIds.
- Puede ejecutarse sin dependencias: python scripts/generar_sitemap.py
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
from urllib.parse import quote
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

BASE_URL = "https://tecnologiapuntes.github.io/tecno/"
NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NAMESPACE)
EUROPE_MADRID = ZoneInfo("Europe/Madrid")


def data_from_js(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    raw = path.read_text(encoding="utf-8-sig")
    # V58: window.TECNOLOGIA_POSTS = [ ... ]; con contenido JSON válido.
    match = re.search(r"\bwindow\.TECNOLOGIA_POSTS\s*=\s*", raw)
    if not match:
        raise ValueError(f"No se encuentra TECNOLOGIA_POSTS en {path}")
    start = raw.find("[", match.end())
    if start == -1:
        raise ValueError(f"No se encuentra la lista de publicaciones en {path}")
    result, _ = json.JSONDecoder().raw_decode(raw[start:])
    if not isinstance(result, list):
        raise ValueError("TECNOLOGIA_POSTS no contiene una lista")
    return [v for v in result if isinstance(v, dict)]


def cms_payload(path: Path) -> tuple[list[dict], set[str]]:
    if not path.is_file():
        return [], set()
    raw = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(raw, dict):
        raise ValueError("cms-posts.json debe contener un objeto")
    posts = raw.get("posts", [])
    hidden = raw.get("hiddenIds", [])
    if not isinstance(posts, list) or not isinstance(hidden, list):
        raise ValueError("cms-posts.json: posts y hiddenIds deben ser listas")
    return [p for p in posts if isinstance(p, dict)], {str(v) for v in hidden}


def time_of(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    try:
        moment = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
    # Admin schedules are typically ISO UTC. Naive dates are treated as Spain time.
    return moment.replace(tzinfo=EUROPE_MADRID).astimezone(timezone.utc) if moment.tzinfo is None else moment.astimezone(timezone.utc)


def visible(post: dict, now: datetime) -> bool:
    if not post.get("published"):
        return False
    publish_at = time_of(post.get("publishAt"))
    return publish_at is None or publish_at <= now


def static_urls(root: Path, base: str) -> set[str]:
    urls: set[str] = set()
    for page in root.rglob("*.html"):
        rel = page.relative_to(root).as_posix()
        parts = page.relative_to(root).parts
        if any(p in {"admin", "assets", "scripts", ".github", "node_modules"} for p in parts[:-1]):
            continue
        if page.name.lower().startswith("google") or page.name.lower() in {"publicar.html", "404.html"}:
            continue
        # A page without ?id= is an empty detail template, not a standalone resource.
        if rel == "publicacion.html":
            continue
        # Folder-index documents have a short, stable canonical directory URL.
        if page.name == "index.html":
            dest = "" if rel == "index.html" else rel.removesuffix("index.html")
        else:
            dest = rel
        urls.add(base + quote(dest, safe="/-._~"))
    return urls


def make_urls(root: Path, base: str = BASE_URL, now: datetime | None = None) -> list[str]:
    root = Path(root)
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    base = base.rstrip("/") + "/"
    posts = {str(p.get("id")): p for p in data_from_js(root / "assets/posts.js") if p.get("id")}
    cms, hidden = cms_payload(root / "assets/cms-posts.json")
    for post in cms:
        if post.get("id"):
            posts[str(post["id"])] = post
    for identifier in hidden:
        posts.pop(identifier, None)
    urls = static_urls(root, base)
    for identifier, post in posts.items():
        if len(identifier) > 180 or any(ord(ch) < 32 for ch in identifier):
            continue
        if visible(post, now):
            urls.add(base + "?post=" + quote(identifier, safe=""))
    return sorted(urls)


def create_sitemap(root: Path, output: Path, now: datetime | None = None, base: str = BASE_URL) -> int:
    urls = make_urls(root, base, now)
    doc = ET.Element(f"{{{NAMESPACE}}}urlset")
    for url in urls:
        node = ET.SubElement(doc, f"{{{NAMESPACE}}}url")
        ET.SubElement(node, f"{{{NAMESPACE}}}loc").text = url
    ET.indent(doc, space="  ")
    payload = ET.tostring(doc, encoding="utf-8", xml_declaration=True) + b"\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    if not output.exists() or output.read_bytes() != payload:
        output.write_bytes(payload)
        print(f"sitemap.xml actualizado: {len(urls)} enlaces públicos")
    else:
        print(f"sitemap.xml ya está actualizado: {len(urls)} enlaces públicos")
    return len(urls)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generar sitemap XML de TecnologíaInsti")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output.resolve() if args.output else root / "sitemap.xml"
    create_sitemap(root, output)


if __name__ == "__main__":
    main()

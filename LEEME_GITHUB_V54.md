# TecnologíaInsti V54 · Administrador ampliado

## Instalación desde V53

1. Sincroniza el repositorio en GitHub Desktop mediante **Fetch origin** y **Pull origin** cuando aparezca. Comprueba que no haya conflictos pendientes.
2. Descomprime `TecnologiaInsti_V54_SOLO_CAMBIOS_DESDE_V53.zip` en la raíz del repositorio `tecno`, conservando las carpetas.
3. Confirma los cambios (**Commit**) y publícalos (**Push origin**). Revisa GitHub Pages y actualiza con `Ctrl+F5`.
4. Accede a `https://tecnologiapuntes.github.io/tecno/admin/` con el token de GitHub que ya usas. No se necesita otro token ni Supabase.

## Qué permite hacer

- **Publicaciones**: publicar ahora, guardar borrador o programar fecha y hora (zona horaria `Europe/Madrid`), además de etiquetas, búsqueda y filtros por fecha/estado/categoría.
- **Biblioteca multimedia**: escanear y reutilizar imágenes y documentos ya alojados, subir archivos nuevos. Las imágenes de uso web se convierten a WebP hasta 1800 px de dimensión máxima; los documentos no se convierten.
- **Portada**: cambiar titular, descripción, botones y elegir imagen nueva o existente, además de ordenar las tarjetas principales.
- **Videotutoriales**: incorporar manualmente vídeos de YouTube en IA o Séneca; título y descripción en español, miniatura opcional y edición posterior. Las incorporaciones manuales tienen prioridad sobre la sincronización automática cuando comparten el mismo ID.
- **Menús**: se conserva el administrador actual de tres niveles y todos los elementos previamente creados.

## Publicaciones programadas: funcionamiento y límites

El estado `Programar` guarda `publishAt` en formato ISO (UTC). La web comprueba la fecha al cargarse y no muestra la publicación antes de ese momento. No hace falta configurar GitHub Actions, pero **no es un mecanismo para mantener contenido secreto**: los datos pueden consultarse en un repositorio GitHub público. Tampoco es una notificación ni envía automáticamente posts a Instagram; la aparición puede retrasarse por caché o despliegue.

## Biblioteca multimedia

La biblioteca utiliza el árbol de GitHub para indexar archivos de `assets/posts`, `assets/descargas` y `assets/biblioteca`. No crea duplicados al seleccionar uno ya existente. Los PDF/Word/Excel/PowerPoint conservan sus formatos originales. El máximo desde el administrador es 10 MB por archivo. Las imágenes destinadas a impresión deben conservarse también como originales o PDF descargable.

## Archivos de datos protegidos (no incluidos en los ZIP)

- `assets/cms-posts.json` — tus publicaciones y borradores.
- `assets/cms-menu.json` — tus menús personalizados.
- `assets/cms-site.json` — la portada personalizada que guardes.
- `assets/cms-videos.json` — vídeos que agregues manualmente.
- `assets/seneca-videos.json` y `assets/ia-videos.json` — listas sincronizadas por GitHub Actions.

**Nunca borres esos archivos para instalar una actualización.** Las versiones anteriores de publicaciones se mantienen. Los cambios se guardan con la API de GitHub mediante commits que no fuerzan el historial.

## Seguridad

No compartas tu token de GitHub. El administrador necesita el permiso `Contents: Read and write` solo para el repositorio `tecno`. Se mantiene en memoria de la pestaña, sin guardarse en la web.

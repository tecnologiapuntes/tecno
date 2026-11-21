# TecnologíaInsti V53 · Menús anidados plegados por defecto

## Novedad
En el botón «Menú», los niveles internos ya no se expanden automáticamente.
Los subapartados de nivel 3 (por ejemplo: Apuntes → 2.º ESO → Dibujo Técnico)
aparecen solo después de pasar el ratón por el padre o pulsarlo.
Esto se aplica a la portada, Cuaderno de Séneca y Videotutoriales IA.

## Instalar sobre la V52
1. En GitHub Desktop ejecuta Fetch/Pull antes de actualizar, si hay cambios remotos.
2. Extrae el ZIP "SOLO_CAMBIOS_DESDE_V52" y copia las rutas manteniendo sus carpetas.
3. Haz Commit y Push origin.
4. Abre la web con Ctrl+F5 si notas que la caché conserva el comportamiento anterior.

## Seguridad de tus contenidos
No se incluyen ni se sobrescriben estos archivos dinámicos de GitHub:
- assets/cms-menu.json (tus apartados personalizados)
- assets/cms-posts.json (tus publicaciones creadas desde el editor)
- assets/seneca-videos.json (YouTube Séneca)
- assets/ia-videos.json (YouTube IA)

No se modifica el archivo original assets/posts.js ni el administrador.

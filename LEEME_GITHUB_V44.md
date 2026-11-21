# TecnologíaInsti V44 — Gestor de publicaciones gratuito

**PANEL:** https://tecnologiapuntes.github.io/tecno/admin/

1. Primero, sube **una sola vez** los archivos del ZIP V44 al repositorio GitHub Pages.
2. Crea un **token personal de GitHub con permisos Contents: Read and write** limitado a `tecnologiapuntes/tecno`: https://github.com/settings/personal-access-tokens/new
3. En el panel privado, conecta el token (sin enviarlo a nadie), crea tus publicaciones y pulsa Guardar.
4. El panel guarda la publicación y todos sus archivos en un único commit. GitHub Pages actualizará tu web.
5. Consulta las instrucciones completas en `admin/GUIA_DE_USO.md`.

**No borres ni reemplaces estos dos archivos generados:**

- `assets/cms-posts.json`: tus futuras publicaciones hechas desde el panel.
- `assets/seneca-videos.json`: los 18 vídeos sincronizados del Cuaderno de Séneca.

Ninguno de esos dos archivos se incluye en el ZIP V44. Esto es deliberado para evitar sobrescribir contenido existente.

Esta versión conserva las 24 publicaciones y el resto de la V43 sin modificaciones de diseño. El panel puede publicar en los apartados **existentes**, pero todavía no permite crear apartados nuevos en el menú. Iniciar sesión es mediante **token GitHub**, no usuario/contraseña propios (GitHub Pages es estático).

# TecnologíaInsti V41 · Portada corregida y cierre de publicaciones pulsando fuera

Se ha incorporado el carrusel correcto «6 tipos de fichas para tus clases con Gemini y ChatGPT», con **ocho imágenes WebP** (portada + siete láminas), y se ha mejorado la navegación en las publicaciones: ahora pueden cerrarse pulsando en el fondo exterior. También se pueden cerrar las imágenes ampliadas pulsando en el fondo, sin interrumpir la navegación con flechas.

## Cómo actualizar sin conflictos desde V40

1. Antes de subir archivos, termina cualquier fusión pendiente y sincroniza GitHub Desktop (Fetch origin y Pull origin).
2. Descomprime el ZIP «SOLO CAMBIOS DESDE V40» y copia sus archivos a la raíz del repositorio, respetando la estructura de carpetas.
3. Haz Commit y Push origin. Para ver la nueva portada, recarga la página con Ctrl + F5 si fuera necesario.
4. **No borres ni reemplaces `assets/seneca-videos.json`**: contiene la lista real de 18 vídeos que genera GitHub Actions; no se distribuye en ninguno de los ZIP de V41.

## Archivos principales modificados

- `assets/posts.js`: enlaza las ocho imágenes correctas de la publicación.
- `assets/app.js`: cierre al pulsar en el fondo oscuro exterior.
- `index.html`: actualización de las referencias de los scripts para evitar caché antigua.
- `assets/posts/FichasIA-20261118-V41-00.webp` a `-07.webp`: el carrusel corregido.

---

## Nota sobre el conflicto anterior

# TecnologíaInsti V40 · Corrección del conflicto de Cuaderno de Séneca

## El problema que se ha corregido

El ZIP completo de versiones anteriores incluía un archivo de ejemplo vacío
`assets/seneca-videos.json` (`"videos": []`). GitHub Actions ya había generado
en el repositorio la versión real con los 18 vídeos. Subir el ZIP anterior o
fusionar su rama podía provocar conflictos o sustituir el archivo real.

**A partir de la V40 ese archivo no se distribuye en los ZIP.** Conservar el
archivo existente en el repositorio es imprescindible: es el que utilizan las
miniaturas, títulos y enlaces de los 18 videotutoriales.

## Para actualizar desde la V39

1. Resuelve o cancela antes los conflictos de fusión que haya en GitHub.
2. Cuando tengas la rama principal sincronizada, extrae el ZIP de **solo
   cambios V40** y copia los archivos a la raíz de tu repositorio, respetando
   las carpetas. En esta actualización solo cambia el workflow de GitHub.
3. No borres ni sustituyas `assets/seneca-videos.json`.
4. GitHub Desktop: primero **Fetch origin**, después **Pull origin**, confirma
   y sube los cambios con **Push origin**.

## Si tienes el conflicto abierto ahora

- Abre `assets/seneca-videos.json` en el editor de conflictos.
- **Conserva la versión completa que contiene los 18 vídeos**, no la versión
  vacía que muestra `"videos": []`.
- Elimina las marcas `<<<<<<<`, `=======`, `>>>>>>>` y comprueba que el archivo
  JSON sigue teniendo un único objeto y la lista `videos` completa.
- Marca el conflicto como resuelto, finaliza la fusión y comprueba la web.
- Si necesitas ayuda para saber qué bloque conservar, no finalices la fusión
  y comparte el contenido del conflicto (puede ser una captura).

## Sobre el ZIP completo

Contiene toda la web de la V39, más esta corrección, **excepto** el archivo
`assets/seneca-videos.json`. Eso es intencionado. En una instalación nueva
sin ese archivo, el sistema mostrará temporalmente el enlace a la lista de
reproducción y el workflow lo generará al sincronizar YouTube.

No se han modificado las publicaciones ni los demás archivos de contenido.

# TecnologíaInsti — V37 · Cuaderno de Séneca

## Qué cambia

- Se elimina el índice de vídeos duplicado. El apartado muestra directamente tarjetas con miniaturas, búsqueda y reproducción.
- Se añaden a la **barra superior de Cuaderno de Séneca** los mismos tres menús desplegables que en Inicio: Inteligencia Artificial, Proyectos y Herramientas docentes (con Cuaderno de Séneca y Herramientas Docentes).
- Los títulos mostrados se presentan en español, aplicando traducciones precisas para los temas conocidos. En los vídeos con título inglés aún no traducido se usa temporalmente un título neutro en español para no inventar contenido.
- Cuando GitHub sincroniza YouTube, se intenta generar automáticamente traducciones de títulos y descripciones. Las traducciones anteriores se conservan para cada vídeo y pueden revisarse si el servicio automático no acierta.
- Si una descripción original está en inglés y su traducción aún no está disponible, se presenta un aviso en español con enlace al original en YouTube, no un texto inventado.
- Conserva el diseño en azul noche, turquesa y melocotón, tarjetas y el menú móvil.

## Cómo actualizar desde V36

1. Usa el ZIP **SOLO_CAMBIOS_DESDE_V36** y descomprímelo sobre la raíz de tu repositorio, respetando la carpeta `assets`, `scripts` y `.github/workflows`.
2. **No borres ni sobrescribas `assets/seneca-videos.json`**: allí se encuentran los metadatos de los vídeos recuperados desde YouTube. Este ZIP no incluye dicho archivo.
3. Sincroniza antes GitHub Desktop: **Fetch origin → Pull origin** (resuelve conflictos si los hay) y después **Push origin**.
4. En **GitHub → Actions → Sincronizar vídeos del Cuaderno de Séneca → Run workflow**, ejecuta la sincronización para intentar completar traducciones de los 18 vídeos. Es necesario que YouTube y el servicio de traducción sean accesibles; si fallan, la página conserva el texto en español de reserva.
5. Recarga la página con **Ctrl + F5**.

## ZIP completo

Para no destruir accidentalmente los 18 registros de tu repositorio, el ZIP WEB_COMPLETA_GITHUB **omite intencionadamente** `assets/seneca-videos.json`. Si ya tienes la web, **conserva la versión existente** de ese archivo. En una instalación nueva, la acción de sincronización lo creará cuando obtenga datos; mientras tanto se muestra un reproductor de la lista original.

La web pública sigue siendo GitHub Pages, y este paquete no modifica el `index.html`, `assets/app.js` ni `assets/posts.js` de la V36.


### Actualización V39

Sube el contenido de **V39_SOLO_CAMBIOS_DESDE_V38** conservando la estructura de las carpetas. `assets/posts.js` reemplaza el archivo de publicaciones, `index.html` actualiza la caché y `assets/posts/FichasIA-20261118-*.webp` contienen las ocho imágenes. La carpeta de Google Drive sigue enlazada para descargar el Word y las infografías.

# TecnologíaInsti V51 · Actualización desde V50

**Recomendado:** descomprimir `TecnologiaInsti_V51_SOLO_CAMBIOS_DESDE_V50.zip` en la raíz de tu repositorio, conservando las carpetas, y confirmar los cambios con GitHub Desktop.

## Cambios de esta versión

- Menús de **tres niveles**, sincronizados entre la barra superior, el botón «Menú» y las páginas de vídeos. Puedes gestionarlos desde `/admin/` y asignar tus publicaciones a cualquier subapartado de tipo categoría.
- Nuevo **Tablón de novedades** en portada: vídeos y publicaciones de todas las secciones, ordenados por fecha, con filtros y buscador. Cada vídeo abre su reproductor y descripción.
- Se priorizan las fechas originales. Vídeos sin fecha disponible aparecen al final marcados como «Fecha pendiente».
- Scripts de GitHub Actions para recopilar las fechas originales en futuras sincronizaciones. No se han inventado fechas.

## Muy importante

1. La web pública del tablón necesita los JSON que ya ha generado GitHub (`assets/seneca-videos.json` y `assets/ia-videos.json`). **No copies archivos vacíos sobre ellos.** Esta versión no los incluye.
2. Tampoco se incluyen `assets/cms-posts.json` ni `assets/cms-menu.json` porque contienen las publicaciones y los menús creados por ti desde el panel.
3. La V51 se ha probado con datos simulados; la sincronización real depende de tu repositorio y la disponibilidad de YouTube.
4. Tras publicar V51, ejecuta en GitHub → **Actions** las acciones de sincronización de **Cuaderno de Séneca** y **Videotutoriales IA** para completar las fechas disponibles.
5. Si GitHub Desktop indica «Newer commits on remote», haz primero **Fetch** y **Pull**; resuelve cualquier conflicto antes de subir el ZIP.
6. Abre la portada y actualiza con Ctrl+F5 para evitar estilos almacenados en el navegador.

No hace falta crear otro token ni utilizar Supabase.

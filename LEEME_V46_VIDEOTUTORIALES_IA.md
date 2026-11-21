# V46 · Videotutoriales de Inteligencia Artificial

## Qué hay de nuevo

- **Inteligencia Artificial → Videotutoriales** en la barra superior y en el botón «Menú».
- Página `videotutoriales-ia.html` con buscador y tarjetas de vídeo en tres columnas, dos en tableta y una en móvil.
- Cada tarjeta abre un reproductor con el vídeo, su descripción y los botones anterior/siguiente. Pulsa fuera del cuadro, Escape o la X para cerrar.
- Lista original: https://www.youtube.com/playlist?list=PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj
- Sincronización gratuita desde GitHub Actions, con intento semanal de actualización.
- El menú se puede seguir editando desde `/admin/`. Los menús creados con V45 se migran automáticamente sin perder sus apartados.

## IMPORTANTE: activar la lista real en GitHub

Desde este entorno no ha sido posible obtener los metadatos completos de YouTube. **No se han inventado ni títulos ni vídeos**. Al publicar V46, se ve la lista mediante el reproductor original de YouTube; para generar tarjetas con títulos, miniaturas y descripciones auténticas:

1. Entra en GitHub → repositorio `tecnologiapuntes/tecno` → **Actions**.
2. Abre **Sincronizar videotutoriales de Inteligencia Artificial**.
3. Pulsa **Run workflow**. La acción intenta recuperar la lista completa desde YouTube con `yt-dlp`.
4. Si YouTube responde, se creará `assets/ia-videos.json` y aparecerán las tarjetas automáticamente tras el despliegue. Si falla, permanece el reproductor de la lista original y podrás volver a intentar la sincronización.

El sistema también se ejecutará semanalmente. La lista se considera completa solo si se recuperaron todos los vídeos públicos que YouTube expone a la herramienta. Vídeos privados o que no permitan incrustación pueden no estar disponibles.

## Cómo evitar conflictos

- **No subas** `assets/ia-videos.json` desde el ordenador: lo gestiona GitHub Actions.
- Los ZIP de V46 **no contienen** `assets/ia-videos.json`, `assets/seneca-videos.json`, `assets/cms-posts.json` ni `assets/cms-menu.json`.
- Antes de actualizar desde GitHub Desktop, **Fetch origin → Pull origin** y luego copia los archivos nuevos.
- Las 24 publicaciones existentes y las que hayas añadido desde el panel se conservan.

## Versión
V46 · Basada en V45.

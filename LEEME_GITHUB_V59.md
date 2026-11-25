# TecnologíaInsti V59 · Sitemap automático para Google Search Console

Esta actualización añade un mapa XML de URLs públicas, la automatización que lo mantiene actualizado y un botón de actualización desde el administrador.
No modifica el diseño, el gestor de publicaciones, los menús ni el contenido multimedia.

## Instalación sobre V58

1. Haz `Fetch` y `Pull` en GitHub Desktop para recuperar el contenido real del repositorio.
2. Guarda una copia de seguridad (especialmente si has publicado entradas desde `/admin/`).
3. Copia los archivos del ZIP `SOLO CAMBIOS` conservando las carpetas. **No borres los archivos que ya tienes**.
4. Haz `Commit` y `Push origin`.
5. En el administrador entra en **Seguridad y diagnóstico → Índice para Google** y pulsa **Actualizar sitemap en GitHub**. Esto incluye inmediatamente todas tus publicaciones reales, tanto las originales como las creadas desde el administrador.
6. Comprueba `https://tecnologiapuntes.github.io/tecno/sitemap.xml` después de que termine el despliegue.
7. En Google Search Console, abre **Sitemaps** y envía `https://tecnologiapuntes.github.io/tecno/sitemap.xml` (o solo `sitemap.xml` si la interfaz ya muestra la URL del sitio).

## Cómo funciona

- Incluye las páginas HTML públicas como portada, Cuaderno de Séneca y Videotutoriales IA.
- Incluye las 24 publicaciones originales de `assets/posts.js` y las publicaciones visibles de `assets/cms-posts.json` que hayas creado desde el administrador.
- Respeta `hiddenIds`, borradores y publicaciones programadas aún no visibles.
- Usa para cada entrada la ruta individual de V57 `?post=IDENTIFICADOR`, estable aunque edites el título.
- Incorpora cualquier HTML público nuevo que alojes, por ejemplo `herramientas/generador-pra/index.html`, sin necesidad de crear un apartado nuevo en el generador.
- **En cada creación, edición o eliminación desde el administrador**, el archivo `sitemap.xml` se actualiza en el mismo commit que el contenido con tu token habitual de GitHub, para que GitHub Pages publique ambos juntos. La restauración de copias también reconstruye el sitemap.
- También hay una tarea de GitHub Actions que revisa cambios y las publicaciones programadas una vez al día. Puede ejecutarse manualmente desde Actions.
- **Límite de GitHub Pages:** cuando una tarea de Actions utiliza su `GITHUB_TOKEN` para guardar un cambio, ese commit **no desencadena por sí solo otro despliegue de Pages**. Por eso, para asegurar que un sitemap regenerado por la tarea programada se vea ya en la web, tendrás que esperar a otro despliegue normal o pulsar el botón de **Actualizar sitemap en GitHub** desde el administrador. Las publicaciones que guardas desde el gestor no tienen ese problema.
- No necesitas un token adicional ni servicios externos; el botón del administrador usa el token que ya utilizas para publicar.

### Advertencias

- Un sitemap ayuda a Google a descubrir direcciones, pero **no garantiza que aparezcan en el buscador**.
- Algunas entradas individuales se muestran con JavaScript; Google debe poder procesarlas. Es posible que tarde en indexarlas.
- El sitio se encuentra bajo `/<repo>/` (`/tecno/`), por eso debe enviarse exactamente esa URL en Search Console.
- Esta actualización NO incluye los archivos personalizados de GitHub: `assets/cms-posts.json`, `assets/cms-menu.json`, `assets/cms-site.json`, `assets/cms-theme.json`, `assets/cms-videos.json`, `assets/cms-media.json`, `assets/ia-videos.json` y `assets/seneca-videos.json`.
- Conserva el archivo `google*.html` que ya subiste para verificar Search Console. **No está incluido en el ZIP y no debes borrarlo**.

## Integrar el generador de PRA

El HTML autónomo del generador puede publicarse en `herramientas/generador-pra/index.html`. Si necesita CSS, JS o imágenes, añade todos esos ficheros en la misma carpeta y respeta sus rutas relativas.

1. Sube la carpeta a GitHub Desktop y publica los cambios.
2. El enlace público será `https://tecnologiapuntes.github.io/tecno/herramientas/generador-pra/`.
3. Desde el administrador, crea una publicación dentro de **Herramientas docentes → Herramientas docentes** (categoría `Utilidades Séneca`).
4. En **Enlaces y descargas**, pulsa **+ Añadir enlace** y configura el botón, p. ej.: `Abrir generador de PRA`, con esa dirección completa.
5. Puedes incluir después un segundo enlace a Chrome Web Store cuando esté aprobada.

**Importante:** si el archivo HTML usa funciones exclusivas de una extensión de Chrome, es posible que necesite una adaptación para funcionar desde GitHub Pages. No publiques en la web claves de API ni datos privados.

# TecnologíaInsti V58 · Apariencia y colores

1. Actualiza a partir de V57 usando el ZIP **Solo cambios desde V57**.
2. Haz Fetch/Pull de GitHub Desktop antes de copiar los archivos.
3. Descomprime respetando carpetas, confirma los cambios y haz Push.
4. Abre `/tecno/admin/`, conecta con el token habitual y entra en «Apariencia y colores».
5. Elige una de las 18 paletas, revisa la vista previa y pulsa «Guardar colores en GitHub».
6. Tras publicar GitHub Pages, actualiza la web. Todas las páginas públicas leen `assets/cms-theme.json`.

El **tema original** mantiene exactamente el diseño anterior. La selección global se guarda en
`assets/cms-theme.json` y no se sobrescribe al instalar futuros ZIP de actualización.
Los archivos `assets/cms-posts.json`, `assets/cms-menu.json`, `assets/cms-site.json`,
`assets/cms-videos.json`, `assets/cms-theme.json`, `assets/ia-videos.json` y
`assets/seneca-videos.json` **no están dentro de ningún ZIP V58**.

La nueva copia JSON desde «Seguridad y diagnóstico» incluye el tema seleccionado;
la restauración de copias anteriores conserva el tema si la copia no lo contiene.
Los estilos se aplican a componentes propios del sitio. Las imágenes y miniaturas
conservan sus colores originales. La web en GitHub Pages mantiene el mismo contenido.

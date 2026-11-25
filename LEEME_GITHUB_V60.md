# TecnologíaInsti V60 · Generador PRA V1.7 en la web

Se ha añadido exactamente el HTML funcional que aportaste, sin alterar su programación, en:

`herramientas/generador-pra/index.html`

La dirección pública prevista **después del Commit + Push y publicación en GitHub Pages** es:

https://tecnologiapuntes.github.io/tecno/herramientas/generador-pra/

## Instalar encima de V59

1. Abre el repositorio `tecno` con GitHub Desktop. Haz `Fetch origin` y `Pull origin`.
2. Extrae el ZIP **SOLO CAMBIOS** sobre la carpeta raíz del repositorio. Debe quedar exactamente `herramientas/generador-pra/index.html`.
3. Confirma que el archivo se añadió, realiza **Commit** y **Push origin**.
4. Cuando termine GitHub Pages, abre la URL indicada arriba y comprueba que funciona.
5. En `/admin/` → **Seguridad y diagnóstico → Actualizar sitemap en GitHub**, actualiza el índice de Google para incorporar esta página.
6. Crea la publicación desde tu gestor, dentro de **Herramientas docentes**, y en **Enlaces y descargas** añade un enlace llamado «Abrir generador de PRA» con la URL pública.

## Funcionamiento y límites

- La web permite seleccionar necesidades, generar los cinco textos, copiar, descargar Word e imprimir/guardar PDF. No requiere servidor ni bibliotecas externas. Este archivo integra el estilo, la lógica y el logo.
- La página web **no puede rellenar automáticamente Séneca**, porque esa función utiliza permisos exclusivos de la extensión de Chrome. Para ello habrá que instalar la extensión aprobada.
- No se envían datos a servidores por la aplicación; guardar preferencias docentes es optativo en el navegador.
- **No se ha publicado automáticamente en tu repositorio**, porque no tenemos acceso de escritura a tu GitHub en esta sesión. La dirección solo comenzará a funcionar cuando subas el archivo.
- No borres ni sobrescribas los archivos personalizados, el sitemap dinámico ni el HTML de verificación de Google.

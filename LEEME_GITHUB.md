# TecnologíaInsti — V31

## Cambios en esta versión
- Menú desplegable con 3 tarjetas: «Prompts y recursos IA», «Proyectos» y «HERRAMIENTAS DOCENTES».
- Eliminada la tarjeta «Empieza por aquí» y los rótulos pequeños «02», «03», «04» de las demás.
- Paleta uniforme en toda la página: azul noche, turquesa y melocotón. Diseño adaptable a escritorio y móvil.
- El contenido de publicaciones, fechas, categorías, imágenes, vídeos y enlaces se mantiene intacto.

## Cómo actualizar GitHub Pages
1. Si ya tienes la **V30**, descarga el archivo **SOLO_CAMBIOS_DESDE_V30**.
2. Descomprímelo y copia su contenido a la **raíz del repositorio**, sobrescribiendo los archivos existentes, incluida la carpeta `assets`.
3. Si no estás seguro de la versión anterior, utiliza el archivo **WEB_COMPLETA_GITHUB** y sustituye el contenido del repositorio con sus archivos.
4. Actualiza la página con **Ctrl+F5** para evitar que se muestre el diseño guardado en caché.

> La opción «Gestionar contenidos» está oculta en la navegación, pero el archivo de gestión sigue existiendo. Ocultar un enlace no equivale a proteger la herramienta.


## NOVEDAD V35: CUADERNO DE SÉNECA

- Archivo nuevo: `cuaderno-seneca.html`. Se abre desde **Herramientas docentes → Cuaderno de Séneca** en la cabecera y el menú.
- Índice adaptable de tres columnas en ordenador; NO se muestra el recuadro decorativo que indicaba «3 columnas del índice».
- Cada vídeo recuperado de YouTube aparece en una tarjeta con miniatura, título y descripción, con reproductor integrado al abrir. No se inventan metadatos.
- Los datos se guardan en `assets/seneca-videos.json` y se intentan actualizar mediante GitHub Actions. La lista original se reproduce incluso si no se puede recuperar el inventario.
- Tras subir todos los archivos a GitHub, abre **Actions → Sincronizar vídeos del Cuaderno de Séneca → Run workflow** para intentar importar inmediatamente los vídeos. Para guardar los cambios generados, quizá necesites habilitar **Settings → Actions → General → Workflow permissions → Read and write permissions**.
- YouTube puede bloquear la obtención automática. En ese caso la lista original seguirá enlazada y reproducible; el índice individual se activará cuando se consiga sincronizar.

Conserva la estructura de carpetas del ZIP, incluida `.github/workflows/`. Si ya tienes la V34, sube la versión de solo cambios.

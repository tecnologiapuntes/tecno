# TecnologíaInsti · V56 · Enlaces, buscador, copias y diagnóstico

## Instalación recomendada (si ya utilizas V55)

1. Haz **Fetch origin / Pull origin** en GitHub Desktop antes de empezar. Comprueba que no hay modificaciones pendientes.
2. Por seguridad, guarda una copia de tu repositorio actual (GitHub > Code > Download ZIP). Este paso es especialmente recomendable antes de cambios importantes.
3. Descomprime `TecnologiaInsti_V56_SOLO_CAMBIOS_DESDE_V55.zip` dentro de la carpeta raíz del repositorio `tecno`, **respetando las subcarpetas `assets/` y `admin/`**.
4. Comprueba los cambios y haz Commit > Push origin.
5. Cuando se publique GitHub Pages, pulsa **Ctrl + F5**. Abre la portada, una publicación y el administrador.

El ZIP de solo cambios NO contiene `assets/cms-posts.json`, `assets/cms-menu.json`, `assets/cms-site.json`, `assets/cms-videos.json`, `assets/ia-videos.json`, `assets/seneca-videos.json`, ni modifica los archivos de medios del usuario.

## Novedad 1. Enlaces individuales y compartir

Cada tarjeta tiene «Enlace directo». El gestor muestra «Ver enlace» y «Copiar enlace» en las publicaciones ya visibles. En el detalle hay botones para compartir y copiar.

Formato de URL: `https://tecnologiapuntes.github.io/tecno/publicacion.html?id=IDENTIFICADOR`.

El identificador se conserva al editar el título. Las entradas antiguas utilizan los IDs que ya tienen. Los borradores y programados no aparecen hasta su publicación (pero, como el repositorio es público, no son secretos en el JSON).

**Limitación del hosting estático:** las previsualizaciones enriquecidas de WhatsApp y otras redes no muestran necesariamente título/foto individual del recurso, porque los robots de esas plataformas no ejecutan el JavaScript que carga el contenido. Compartir el enlace sí funciona. Para tarjetas sociales personalizadas por publicación se necesita generar metadatos HTML en la compilación o utilizar otro sistema de publicación.

## Novedad 2. Buscador educativo avanzado

En Novedades, además de los filtros existentes de tipo y etiquetas, se añaden curso, materia, tipo de recurso y orden por fecha/título. El gestor permite indicar explícitamente curso, materia y tipo al crear o editar una entrada. Las publicaciones antiguas se clasifican mediante el texto disponible, de forma orientativa (no se inventan metadatos guardados).

## Novedad 3. Copias y restauración

En el panel «Seguridad y diagnóstico»:

- **Descargar copia de datos JSON:** incluye `cms-posts`, `cms-menu`, `cms-site`, `cms-videos`, además de una copia de lectura de las entradas originales de `posts.js`. No incluye archivos binarios.
- **Descargar copia completa del repositorio ZIP:** enlace a GitHub para conservar también fotos, PDFs, Word, vídeos locales, scripts y los JSON que existan en el repositorio.
- **Restaurar copia JSON:** doble confirmación; crea un commit nuevo que escribe únicamente los JSON presentes en la copia y **no borra fotos, documentos ni archivos de código**. Si un archivo JSON no existía en la copia, se deja como está. Se puede revertir el commit desde GitHub si resulta necesario.

No se guarda el token de GitHub en el archivo de copia. Guarda los respaldos en un lugar privado y seguro.

## Novedad 4. Diagnóstico (solo lectura)

Compara los enlaces internos de las publicaciones con el árbol real de GitHub; marca archivos no encontrados, entradas sin portada o contenido, fechas poco claras e imágenes grandes. Muestra también contadores informativos.

**Limitación:** no certifica enlaces externos de Instagram, YouTube o Drive: el navegador no puede verificarlos de forma fiable por las políticas de origen cruzado. No elimina ni modifica archivos.

## Compatibilidad

- No se reemplaza la configuración de menús ni de portada guardada en GitHub.
- El editor de publicaciones de V55 sigue funcionando con imágenes, carruseles, documentos, texto con formato, etiquetas y programación.
- Se conservan las páginas `cuaderno-seneca.html` y `videotutoriales-ia.html` y sus sincronizaciones automáticas.
- La web completa incluye el contenido original que ya formaba parte de la V55, pero **no incluye los JSON ni los archivos personalizados añadidos posteriormente desde tu administrador**. Para actualizar una web ya en uso, usa siempre **Solo cambios desde V55**.

## Comprobaciones realizadas

Pruebas de sintaxis de JavaScript; interfaz y filtros en pantallas de escritorio y móvil; detalles de entradas originales y nuevas; ocultación de borradores; conexiones GitHub simuladas para guardar una publicación, exportar/restaurar un respaldo y ejecutar el diagnóstico. No se ha accedido a tu token real ni se ha cambiado tu repositorio.

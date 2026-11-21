# TecnologíaInsti · Publicar por tu cuenta (versión V44)

## ¿Cuánto cuesta?

**0 €/mes** con GitHub Pages, el repositorio que ya utilizas y el panel incluido en la web. No necesitas contratar Supabase, un dominio nuevo ni un servidor de autenticación. GitHub Pages puede estar sujeto a sus límites de uso y las condiciones de su plan gratuito.

## 1. Instalación inicial: solo una vez

1. Actualiza el repositorio **tecnologiapuntes/tecno** con el ZIP de V44. Si ya tienes la V43, utiliza el paquete **SOLO CAMBIOS**.
2. **No borres** `assets/seneca-videos.json` (lista real de tus vídeos de Séneca).
3. Si ya has creado contenido desde el nuevo panel, **no borres ni sobrescribas** `assets/cms-posts.json`, que contiene las publicaciones autogestionadas. Este archivo nunca se incluye en los ZIP de V44.
4. Haz `Fetch origin → Pull origin` en GitHub Desktop antes de copiar los archivos para evitar conflictos. Realiza el commit y `Push origin`.
5. Una vez GitHub Pages haya desplegado el cambio, abre **https://tecnologiapuntes.github.io/tecno/admin/**.

## 2. Activar el acceso privado a GitHub

GitHub Pages es una web estática: no dispone de una base de datos de usuarios y contraseñas propias. Para publicar **de verdad** se necesita autenticar la operación de escritura en GitHub. En V44 se usa un **token personal de acceso limitado** en vez de pedir tu contraseña.

1. Inicia sesión en tu cuenta de GitHub como siempre.
2. Entra en: https://github.com/settings/personal-access-tokens/new
3. Elige **Fine-grained personal access token**; ponle un nombre como `TecnologiaInsti-CMS`.
4. Como propietario, selecciona la cuenta con acceso de escritura al repositorio y, en **Repository access**, selecciona **Only select repositories** → **tecno**.
5. En **Repository permissions**, configura únicamente **Contents → Read and write** (Metadata Read es automático). No necesitas permisos de administración ni de workflows.
6. Elige una caducidad adecuada a tus preferencias. Cuando caduque tendrás que generar otro.
7. Copia el token en un lugar seguro. **No lo compartas, no lo incluyas en archivos y no se lo envíes a ChatGPT.**
8. En el panel, pégalo en el campo `Token personal de GitHub` y pulsa **Conectar**.

**Seguridad:** el token se conserva solamente en la memoria de la pestaña mientras usas el panel; al recargar o cerrar la pestaña desaparece. El panel público es visible como cualquier página, pero **nadie puede escribir en el repositorio sin un token con permisos**. La seguridad no depende de ocultar el enlace.

## 3. Crear tu primera publicación

1. Abre `/tecno/admin/`, conecta tu token y pulsa **+ Nueva publicación**.
2. Escribe **título, apartado, fecha, descripción corta y texto completo**.
3. Sube la **portada y las imágenes del carrusel** (PNG, JPEG o WebP; hasta 10 MB por archivo de origen). Se convierten automáticamente a WebP, conservando hasta 1800 píxeles en el lado mayor. La **primera** imagen será la portada: usa las flechas para cambiar el orden.
4. Añade el nombre y la URL del documento Word en Google Drive y, si quieres, otro enlace a Instagram. Puedes añadir tantos enlaces como necesites.
5. También puedes cargar un documento directamente en la web (Word, PDF, Excel o PowerPoint, máximo 10 MB). No es obligatorio cuando ya tienes Drive.
6. Deja marcada **Publicar ahora** para que aparezca al terminar el despliegue o desmárcala para guardarla como borrador.
7. Pulsa **Guardar en GitHub**. Todo queda registrado en **un único commit**, con imágenes y contenidos, sin subir ZIP ni usar GitHub Desktop.

La fecha sirve para el orden cronológico, **no** para programar la publicación. GitHub Pages necesita terminar su despliegue antes de reflejar los cambios; puede tardar unos minutos. Si no ves la actualización, recarga la web con Ctrl+F5.

## 4. Editar o eliminar

- **Editar**: modifica la publicación, cambia la portada, añade imágenes o ajusta el texto y pulsa Guardar.
- **Eliminar**: retira la publicación del listado público. Por seguridad, **no se borran los archivos de imagen almacenados**, por si necesitas restaurarla desde el historial de GitHub.
- **Borrador**: desmarca la opción de publicar al guardar. La publicación seguirá apareciendo en el panel, pero no en la web pública.
- **Orden cronológico**: el listado público continúa ordenado por la fecha indicada.

Las 24 publicaciones originales de la V43 se conservan en `assets/posts.js`. Las nuevas publicaciones, las modificaciones y las eliminaciones se guardan por separado en `assets/cms-posts.json`. Así es mucho menos probable que una actualización de diseño desde un ZIP sobrescriba contenido creado desde el panel.

## 5. Apartados y limitaciones

El panel permite elegir entre **apartados que ya existen**: IA → Prompts, IA → Recursos IA, Proyectos → 2º/3º/4º ESO y herramientas de Séneca.

**Crear un apartado o subapartado nuevo en la barra de navegación no está incluido en esta primera versión.** Requiere un editor de menús aparte. Del mismo modo, esta V44 no sincroniza automáticamente con Instagram ni publica en una fecha futura: la publicación es inmediata al guardar.

La autenticación mediante el botón habitual «Iniciar sesión con GitHub» (OAuth) puede añadirse posteriormente, pero exige configurar un servicio de autenticación como Cloudflare Workers. Este panel es totalmente gratuito sin ese servicio, a costa de introducir el token en cada sesión.

## 6. Evitar conflictos con GitHub Desktop

- A partir de ahora crea las publicaciones **desde el panel**, no descargando ni reemplazando `posts.js`.
- Antes de seguir actualizando archivos locales con GitHub Desktop, realiza **Fetch origin y Pull origin** para incorporar los commits generados por el panel.
- **Nunca sustituyas** `assets/seneca-videos.json` ni `assets/cms-posts.json` por copias vacías. Los ZIP V44 omiten ambos.
- Si varios editores publican al mismo tiempo, GitHub puede rechazar una operación y pedir que se actualice la lista antes de guardar; así se evita sobreescribir cambios ajenos.

## 7. Solución de problemas

**«Bad credentials» / 401**: token caducado, mal copiado o sin autorización. Crea otro token o revisa sus permisos.

**«Resource not accessible» / 403**: falta Contents Read and write, el repositorio no está seleccionado o la cuenta no tiene permiso de escritura.

**«409 / 422»**: hubo cambios simultáneos en GitHub. Actualiza la lista y vuelve a guardar. Si te preocupa perder un texto largo, cópialo antes de refrescar.

**La web no muestra la entrada**: comprueba que dejaste marcada la opción Publicar ahora, que no queda ningún despliegue pendiente y que has recargado la página. La primera publicación creará automáticamente el archivo `assets/cms-posts.json`.

**Abrir el HTML desde el disco**: el panel está diseñado para usarse desde tu **web publicada**, no abriendo `admin/index.html` como archivo local.

## Menús y apartados (V45)
Consulta `LEEME_GITHUB_V45.md` en la raíz. Puedes crear apartados desde la segunda pestaña del panel, asignar categorías o enlaces, ordenar y guardar.

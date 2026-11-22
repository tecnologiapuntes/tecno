# TecnologíaInsti V57 · Enlaces en la barra del navegador

## Instalación desde V56

1. Haz Fetch/Pull en GitHub Desktop y guarda una copia del repositorio.
2. Descomprime `TecnologiaInsti_V57_SOLO_CAMBIOS_DESDE_V56.zip` sobre la raíz de la web, manteniendo subcarpetas.
3. Comprueba los archivos cambiados y haz Commit → Push origin.
4. Tras la publicación de GitHub Pages, actualiza con Ctrl + F5.

## Cómo funciona

- Pulsa cualquier tarjeta en «Novedades»: la publicación aparece en el mismo lector emergente y la dirección cambia a `https://tecnologiapuntes.github.io/tecno/?post=IDENTIFICADOR`.
- Copia directamente la dirección del navegador, o utiliza el botón «Compartir enlace».
- El botón **Atrás** cierra la publicación; **Adelante** permite reabrirla.
- Si alguien abre un enlace `?post=...`, llega directamente a la publicación sin hacer clic en la lista.
- Al cerrar un enlace abierto directamente, se vuelve al tablón sin salir del sitio.
- Los enlaces de V56 del tipo `publicacion.html?id=...` siguen funcionando. El botón «Abrir página completa» sigue disponible dentro de la publicación.
- El administrador muestra los nuevos enlaces del tablón en «Ver enlace»/«Copiar enlace».

## Seguridad de datos

El ZIP de cambios no contiene `assets/cms-posts.json`, `assets/cms-menu.json`, `assets/cms-site.json`, `assets/cms-videos.json`, `assets/ia-videos.json`, `assets/seneca-videos.json`, ni modifica la biblioteca multimedia ni `assets/posts.js`.

El cambio utiliza únicamente el historial del navegador y los IDs estables existentes; no hay migración ni cambios en GitHub Actions.

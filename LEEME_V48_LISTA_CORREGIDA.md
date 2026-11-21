# V48 · Solución para la lista de videotutoriales de IA

La lista CORRECTA es https://www.youtube.com/playlist?list=PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj

## Qué ocurría
En V47 el código ya contenía el identificador nuevo, pero la página dependía de una sincronización de YouTube para mostrar sus tarjetas. Si GitHub Actions no recuperaba los metadatos o el navegador tenía una página anterior en caché, parecía que la lista seguía sin actualizarse.

## Qué cambia
En V48 el reproductor de la lista correcta es SIEMPRE visible, con un enlace directo a YouTube, aunque los metadatos no estén disponibles. Si GitHub Actions consigue importar los vídeos, también aparecen debajo como tarjetas con miniaturas y descripciones. Nunca se muestran tarjetas de otra lista.

## Instalación
1. Sincroniza tu repositorio en GitHub Desktop (Fetch origin, Pull origin) antes de copiar.
2. Copia el contenido del ZIP de cambios sobre tu repositorio, respetando las carpetas.
3. Haz Commit y Push origin a la rama desde la que se publica GitHub Pages.
4. Abre https://tecnologiapuntes.github.io/tecno/videotutoriales-ia.html?lista=PL4P4xfIXfbrEG2jHodZqqTS65BZBvrauj&v=48 y recarga con Ctrl+F5.
5. Si quieres que también se generen tarjetas, ejecuta Actions → Sincronizar videotutoriales de Inteligencia Artificial → Run workflow. Si falla, revisa el registro de ese workflow; la lista sigue funcionando mediante el reproductor.

No subas ni sustituyas `assets/ia-videos.json`, `assets/seneca-videos.json`, `assets/cms-posts.json` ni `assets/cms-menu.json` desde el ZIP: estos datos los gestiona GitHub.

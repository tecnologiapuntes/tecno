# TecnologíaInsti V40 · Corrección del conflicto de Cuaderno de Séneca

## El problema que se ha corregido

El ZIP completo de versiones anteriores incluía un archivo de ejemplo vacío
`assets/seneca-videos.json` (`"videos": []`). GitHub Actions ya había generado
en el repositorio la versión real con los 18 vídeos. Subir el ZIP anterior o
fusionar su rama podía provocar conflictos o sustituir el archivo real.

**A partir de la V40 ese archivo no se distribuye en los ZIP.** Conservar el
archivo existente en el repositorio es imprescindible: es el que utilizan las
miniaturas, títulos y enlaces de los 18 videotutoriales.

## Para actualizar desde la V39

1. Resuelve o cancela antes los conflictos de fusión que haya en GitHub.
2. Cuando tengas la rama principal sincronizada, extrae el ZIP de **solo
   cambios V40** y copia los archivos a la raíz de tu repositorio, respetando
   las carpetas. En esta actualización solo cambia el workflow de GitHub.
3. No borres ni sustituyas `assets/seneca-videos.json`.
4. GitHub Desktop: primero **Fetch origin**, después **Pull origin**, confirma
   y sube los cambios con **Push origin**.

## Si tienes el conflicto abierto ahora

- Abre `assets/seneca-videos.json` en el editor de conflictos.
- **Conserva la versión completa que contiene los 18 vídeos**, no la versión
  vacía que muestra `"videos": []`.
- Elimina las marcas `<<<<<<<`, `=======`, `>>>>>>>` y comprueba que el archivo
  JSON sigue teniendo un único objeto y la lista `videos` completa.
- Marca el conflicto como resuelto, finaliza la fusión y comprueba la web.
- Si necesitas ayuda para saber qué bloque conservar, no finalices la fusión
  y comparte el contenido del conflicto (puede ser una captura).

## Sobre el ZIP completo

Contiene toda la web de la V39, más esta corrección, **excepto** el archivo
`assets/seneca-videos.json`. Eso es intencionado. En una instalación nueva
sin ese archivo, el sistema mostrará temporalmente el enlace a la lista de
reproducción y el workflow lo generará al sincronizar YouTube.

No se han modificado las publicaciones ni los demás archivos de contenido.

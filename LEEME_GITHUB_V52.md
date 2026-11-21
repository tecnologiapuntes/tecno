# V52 · Formato en las publicaciones

El administrador ahora ofrece botones para **negrita**, *cursiva*, ++subrayado++, ~~tachado~~, encabezados, listas y enlaces en el texto principal, con vista previa en vivo.

## Uso
1. Entra en /admin/ y abre Nueva publicación o Editar.
2. Selecciona una frase y pulsa el formato deseado. Para un enlace, selecciona el texto, pulsa «Enlace» e introduce la URL https:// correspondiente.
3. Comprueba el resultado en «Vista previa de la publicación».
4. Guarda en GitHub como antes.

El contenido se almacena como texto con marcadores sencillos (Markdown), por lo que siguen funcionando las publicaciones antiguas. Los enlaces del cuerpo del texto serán clicables en la web. Enlaces y documentos externos en la sección habitual continúan funcionando.

Los nuevos posts se guardan en assets/cms-posts.json y los menús personalizados en assets/cms-menu.json. **Ninguno de estos archivos se incluye en los ZIP V52**, ni los listados de YouTube: no los sobrescribas al actualizar. No requiere otro token.

Nota: el estilo de texto se aplica al campo «Texto completo de la publicación». El título y el resumen corto se mantienen como texto plano por claridad y consistencia de las tarjetas.

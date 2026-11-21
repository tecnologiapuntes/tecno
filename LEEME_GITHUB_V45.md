# TecnologíaInsti V45 · Publicaciones y menús editables

Instala el ZIP de solo cambios sobre la V44 o la web completa en tu repositorio `tecnologiapuntes/tecno`.

### Nueva pestaña

Entra en `/tecno/admin/` con el token de GitHub de la versión V44. Pulsa **«Menús y apartados»**.

- **Añadir apartado principal:** aparece en la barra superior, en el botón «Menú» y en la portada cuando su destino es una categoría de publicaciones.
- **Añadir subapartado:** aparece dentro de la opción principal y en el menú grande.
- **Editar / eliminar / ↑ / ↓:** modifica los títulos y el orden.
- **Tipo de destino:** «Mostrar publicaciones de una categoría» (nombre interno), «Abrir una página» (por ejemplo `cuaderno-seneca.html`) o «Abrir enlace externo» (HTTPS).
- **Guardar menú en GitHub:** guarda `assets/cms-menu.json` en un único commit. Antes de guardar el panel comprueba que otra sesión no lo haya cambiado.
- **Nueva publicación:** el selector de apartados incluye las categorías nuevas del menú.

La primera vez no hace falta crear manualmente `assets/cms-menu.json`: se usan los tres apartados que ya existían. El panel crea el archivo al guardar por primera vez.

**Importante:** una categoría nueva aparece vacía hasta que publiques entradas asociadas. Si eliminas una categoría de la navegación, sus publicaciones no se borran; podrás recuperarlas editando el menú o consultando el apartado «Todo». Evita dar el mismo nombre interno a categorías diferentes.

No se incluyen ni modifican `assets/seneca-videos.json` ni `assets/cms-posts.json`, para conservar los vídeos y las publicaciones gestionadas desde tu panel.

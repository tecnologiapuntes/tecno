# TecnologíaInsti · V50 — Selector dinámico de apartados y subapartados

Esta actualización corrige el problema por el que **Inteligencia Artificial → Videotutoriales** no aparecía en el desplegable "Apartado de la web" de la página de administración.

## Cómo instalar

1. En GitHub Desktop, haz **Fetch origin** y **Pull origin** antes de copiar archivos: el panel de administración y GitHub Actions generan commits que necesitas incorporar a tu copia local.
2. Si ya tienes la **V49**, descomprime `TecnologiaInsti_V50_SOLO_CAMBIOS_DESDE_V49.zip` y copia **la estructura completa de carpetas** sobre tu repositorio `tecno`, sustituyendo los archivos que tengan el mismo nombre.
3. Haz **Commit** y **Push origin**. Espera a que GitHub Pages termine el despliegue.
4. Abre `https://tecnologiapuntes.github.io/tecno/admin/` y entra con tu token habitual (NO necesitas uno nuevo). Usa `Ctrl+F5` si aún ves una página antigua.
5. Pulsa **+ Nueva publicación**. El selector debe incluir **Inteligencia Artificial → Videotutoriales** y los apartados de tipo categoría que hayas creado desde **Menús y apartados**.

## Funcionamiento

- Al abrir el editor se **consulta el menú actualizado de GitHub**. También se actualiza al pulsar **↻ Actualizar apartados**, o al pulsar **↻ Actualizar lista** en publicaciones.
- Los apartados que has creado desde el gestor, como `Apuntes → 2.º ESO`, aparecerán automáticamente si son de tipo **Mostrar publicaciones de una categoría**.
- **Videotutoriales IA** y **Cuaderno de Séneca** son páginas independientes, pero ahora admiten publicaciones del panel. Se mostrarán debajo de sus correspondientes listados de vídeos, en una sección de recursos (solo si hay publicaciones para esa categoría).
- Para entradas cuyo destino sea únicamente una **página externa o un enlace**, el selector muestra la opción como *solo enlace, no admite publicaciones*. Si quieres publicar posts, crea un subapartado de tipo **Mostrar publicaciones de una categoría**.
- Los menús antiguos se actualizan de forma no destructiva: se añade «Videotutoriales» una sola vez, sin borrar tus subapartados personalizados.

## Importante para evitar conflictos

Los ZIP **NO incluyen** estos archivos que genera GitHub o administra el panel:

- `assets/cms-menu.json` (tu menú personalizado)
- `assets/cms-posts.json` (tus publicaciones del panel)
- `assets/seneca-videos.json` (datos de YouTube de Séneca)
- `assets/ia-videos.json` (datos sincronizados de YouTube de IA)

**No los elimines del repositorio.** Si ya tienes un merge abierto, resuélvelo antes de instalar la actualización. El ZIP de solo cambios es la opción más segura desde la V49.

## Comprobaciones de V50

- Menú antiguo V45 con apartados personalizados: categoría Videotutoriales detectada en el editor.
- Refresco sin salir del formulario: categorías nuevas detectadas, manteniendo la selección.
- Abrir de nuevo el editor: refresco automático desde los datos de GitHub.
- Publicaciones de Videotutoriales IA: aparecen en la página de vídeos y se pueden abrir/cerrar desde sus tarjetas.
- Sintaxis de JavaScript y estructura de los paquetes ZIP comprobadas.

# TecnologíaInsti V49 · Lista de IA

1. Subir los archivos de la V49 (recomendado: solo cambios desde V48).
2. En GitHub > Actions > **Sincronizar videotutoriales de Inteligencia Artificial** > **Run workflow**.
3. El proceso intentará traducir **los títulos y las descripciones completos** al español y registrar la traducción en `assets/ia-videos.json`. Puede tardar y depende de YouTube y del servicio de traducción.
4. En la web se muestran las tarjetas de vídeo y **no aparece el reproductor gigante**. Si no hay datos se verá un aviso pequeño con acceso a la lista original.
5. Los campos originales se conservan en el JSON para referencia, pero la web mostrará la traducción; si falla, ofrece una indicación en español sin atribuir al vídeo contenido inventado.
6. `assets/ia-videos.json`, `assets/seneca-videos.json`, `assets/cms-posts.json`, `assets/cms-menu.json` **no se incluyen** en los ZIP para no sobrescribir los datos dinámicos ya publicados.

**Limitación**: no se puede garantizar una traducción correcta de todo el contenido sin que YouTube y el servicio de traducción respondan. Conviene revisar las traducciones antes de darles difusión.

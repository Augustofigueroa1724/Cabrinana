# Cabriñana · Cuadro de mando

Dashboard financiero privado, contenido en un único archivo HTML autocontenido
(datos y JavaScript embebidos; sin dependencias externas salvo las fuentes de
Google Fonts).

## Archivos

- **`index.html`** — punto de entrada que sirve Cloudflare Pages. Es una copia
  exacta del original.
- **`Cabriñana - cuadro de mando.html`** — archivo original, conservado como
  referencia. No editar `index.html` a mano: regenerarlo copiando el original.
- **`CLAUDE.md`** — estado del despliegue y pasos pendientes (notas de trabajo).

## Despliegue

El sitio se publica con **Cloudflare Pages** conectado a este repositorio
(proyecto **`cabrinana`**, rama `main`). Cada `git push` a `main` dispara un
redespliegue automático.

- **URL de producción:** https://cabrinana.pages.dev
- (Cada deploy genera además una URL temporal con prefijo, p.ej.
  `https://f5d8baa3.cabrinana.pages.dev`; usar siempre la de producción.)

## Privacidad / acceso

Los datos viajan **dentro** del HTML, por lo que la protección debe estar en el
servidor, nunca con una contraseña dentro del archivo. El acceso se restringe
mediante **Cloudflare Access (Zero Trust)**:

- Inicio de sesión con **Google** como Identity Provider.
- Política `Allow` limitada a una lista cerrada de correos autorizados:
  - miguel.kindelan@gmail.com
  - pilar.rioboo@gmail.com
  - rafael.kindelan@gmail.com
  - kinel73@gmail.com

> ✅ **Estado actual:** Access **activo**. El sitio exige login con Google y solo
> entran los 4 correos autorizados. Verificado en incógnito: sin login no se ve
> nada del dashboard.

Para añadir o quitar personas se edita la política de Access en el panel de
Cloudflare Zero Trust (Access → Applications → esta app → Policies). No requiere
tocar el código ni redesplegar. Cada correo debe ser la cuenta Google real con
la que esa persona inicia sesión.

## Actualizar el contenido

1. Sustituir/editar el original `Cabriñana - cuadro de mando.html`.
2. Copiarlo sobre `index.html` (`cp "Cabriñana - cuadro de mando.html" index.html`).
3. `git commit` y `git push` a `main`. Cloudflare Pages redesplegará solo.

## Asistente "Pregúntame!" (chatbot)

Botón flotante arriba a la derecha que abre un chat. Responde en español
**solo** con la información de los documentos de la carpeta `docs/` (PDF/Word).

- **Frontend:** widget embebido al final del HTML.
- **Backend:** `functions/api/chat.js` (Cloudflare Pages Function) que llama a la
  API de Claude (Anthropic). La clave va como **secreto** del proyecto, nunca en
  el HTML. La ruta queda protegida por Cloudflare Access igual que el resto.
- **Documentos:** `scripts/build-kb.mjs` extrae el texto de `docs/` en el build
  (`npm run build:kb`) y lo deja en `functions/api/kb.js`.

### Puesta en marcha en Cloudflare (una vez)
1. **Variable secreta:** Pages → proyecto `cabrinana` → *Settings → Variables and
   Secrets* → añade **`ANTHROPIC_API_KEY`** (tipo *Secret*) con tu clave de
   Anthropic (https://console.anthropic.com → API Keys). (Opcional: `CHAT_MODEL`
   para cambiar de modelo, p. ej. `claude-haiku-4-5` para abaratar.)
2. **Comando de build:** Pages → *Settings → Builds & deployments* → **Build
   command:** `npm run build:kb` (output directory: `/`).
3. Sube documentos a `docs/` y haz push. Cada deploy reconstruye la base de
   conocimiento del chatbot.

# Cabriñana · Cuadro de mando

Dashboard financiero privado, contenido en un único archivo HTML autocontenido
(datos y JavaScript embebidos; sin dependencias externas salvo las fuentes de
Google Fonts).

## Archivos

- **`index.html`** — punto de entrada que sirve Cloudflare Pages. Es una copia
  exacta del original.
- **`Cabriñana - cuadro de mando.html`** — archivo original, conservado como
  referencia. No editar `index.html` a mano: regenerarlo copiando el original.

## Despliegue

El sitio se publica con **Cloudflare Pages** conectado a este repositorio
(rama `main`). Cada `git push` a `main` dispara un redespliegue automático.

URL de producción: `https://cabrinana-cuadro-de-mando.pages.dev` (o el subdominio
que asigne Cloudflare).

## Privacidad / acceso

Los datos viajan **dentro** del HTML, por lo que la protección debe estar en el
servidor, nunca con una contraseña dentro del archivo. El acceso está restringido
mediante **Cloudflare Access (Zero Trust)**:

- Inicio de sesión con **Google** como Identity Provider.
- Política `Allow` limitada a una lista cerrada de correos autorizados.

Para añadir o quitar personas se edita la política de Access en el panel de
Cloudflare Zero Trust (Access → Applications → esta app → Policies). No requiere
tocar el código ni redesplegar.

## Actualizar el contenido

1. Sustituir/editar el original `Cabriñana - cuadro de mando.html`.
2. Copiarlo sobre `index.html` (`cp "Cabriñana - cuadro de mando.html" index.html`).
3. `git commit` y `git push` a `main`. Cloudflare Pages redesplegará solo.

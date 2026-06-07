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

> ⚠️ **Estado actual:** el sitio está desplegado pero **todavía es público**.
> La capa de Access está **pendiente** (ver `CLAUDE.md`). Hasta activarla,
> cualquiera con el enlace ve los datos.

Para añadir o quitar personas se edita la política de Access en el panel de
Cloudflare Zero Trust (Access → Applications → esta app → Policies). No requiere
tocar el código ni redesplegar. Cada correo debe ser la cuenta Google real con
la que esa persona inicia sesión.

## Actualizar el contenido

1. Sustituir/editar el original `Cabriñana - cuadro de mando.html`.
2. Copiarlo sobre `index.html` (`cp "Cabriñana - cuadro de mando.html" index.html`).
3. `git commit` y `git push` a `main`. Cloudflare Pages redesplegará solo.

# CLAUDE.md — Notas de trabajo y estado del despliegue

Contexto para retomar el trabajo en futuras sesiones. Objetivo: publicar el
dashboard `index.html` en un sitio **privado** para 4 personas, con GitHub como
origen + **Cloudflare Pages** (hosting) + **Cloudflare Access** (login Google
restringido por lista de emails).

## El proyecto en una frase

Dashboard financiero en un **único HTML autocontenido** (datos + JS embebidos;
solo depende de Google Fonts). Como los datos van dentro del archivo, la
protección DEBE estar en el servidor (Access), nunca con contraseña en el HTML.
No modificar el contenido ni el título visible del HTML (`Cabriñana · Cuadro de
mando`).

## Datos fijos del proyecto

- **Repo:** https://github.com/Augustofigueroa1724/Cabrinana (rama de producción: `main`)
- **Proyecto Cloudflare Pages:** `cabrinana`
- **URL de producción:** https://cabrinana.pages.dev
- **Admin / contacto:** miguel.kindelan@gmail.com
- **Emails autorizados (los 4):**
  - miguel.kindelan@gmail.com
  - pilar.rioboo@gmail.com
  - rafael.kindelan@gmail.com
  - kinel73@gmail.com
- **Texto de la página de bloqueo de Access:**
  `Para solicitar acceso, escribe a miguel.kindelan@gmail.com`

## Estado actual (2026-06-07)

- [x] **Tarea 1** — Localizado el HTML original (`Cabriñana - cuadro de mando.html`).
- [x] **Tarea 2** — Repo preparado: `index.html` (copia exacta), `.gitignore`,
      `README.md`. Commit y push a `main` hechos.
- [x] **Tarea 3** — Prerequisitos: node v22, git, wrangler 4.x OK (gh no instalado,
      no necesario).
- [x] **Tarea 4** — Cloudflare Pages creado vía **conexión Git** (opción a).
      Desplegado y verificado en navegador: https://cabrinana.pages.dev muestra el
      dashboard. ⚠️ Aún **público** (sin Access).
- [ ] **Tarea 5** — Google como Identity Provider en Cloudflare Access. **BLOQUEADO**:
      al activar Zero Trust, Cloudflare da error de pago genérico
      ("An unexpected error occurred while processing your payment") con varias
      tarjetas → parece incidencia del lado de Cloudflare. Pendiente reintentar
      (revisar https://www.cloudflarestatus.com). Zero Trust plan **Free** ($0,
      hasta 50 usuarios) exige tener un método de pago registrado.
- [ ] **Tarea 6** — Aplicación self-hosted en Access + policy Allow con los 4 emails
      + página de bloqueo. (No empezado.)
- [ ] **Tarea 7** — Verificación: comprobar en incógnito que la URL NO es accesible
      sin login. (No empezado.)

## Decisiones tomadas

- Push directo a `main` (autorizado por el usuario).
- Despliegue por **conexión Git** desde el panel de Cloudflare (no `wrangler deploy`),
  para tener redeploy automático y no compartir tokens.

## Próximos pasos (retomar aquí mañana)

### 1. Desbloquear Zero Trust (Tarea 5)
- Reintentar activar Zero Trust → plan **Free**. Si sigue el error de pago:
  comprobar cloudflarestatus.com, probar en incógnito/otro navegador, otra tarjeta
  de débito con dirección de facturación exacta.
- Al activarlo, elegir un **team name** (sugerido: `cabrinana`). Forma el dominio
  `https://<team-name>.cloudflareaccess.com`.

### 2. Google IdP (Tarea 5)
- En Google Cloud Console (https://console.cloud.google.com):
  - Crear proyecto + **pantalla de consentimiento OAuth** (External). Publicarla
    (In production) para no limitar a "test users", o añadir los 4 como test users.
  - Crear **credenciales OAuth 2.0 → Aplicación web**.
  - **Authorized redirect URI** EXACTO (sustituir `<team-name>`):
    ```
    https://<team-name>.cloudflareaccess.com/cdn-cgi/access/callback
    ```
- En Cloudflare Zero Trust → Settings → Authentication → Login methods → Add → Google:
  pegar Client ID y Client Secret. Pulsar **Test** → debe decir "Your connection works!".

### 3. Aplicación protegida + policy (Tarea 6)
- Zero Trust → Access → Applications → Add → **Self-hosted**.
  - Application domain: subdomain `cabrinana`, domain `pages.dev`.
  - Identity providers: solo **Google**.
- Policy **Allow** "Familia Cabriñana": Include → selector **Emails** con los 4 correos.
- Personalizar **Block page** con el texto indicado arriba.
- (Opcional) Automatizable vía API de Cloudflare con token de permiso
  *Account › Access: Apps and Policies › Edit*.

### 4. Verificación (Tarea 7)
- Abrir https://cabrinana.pages.dev en **incógnito** → debe pedir login Google,
  NO mostrar el dashboard. Un email fuera de la lista → página de bloqueo.

## Plan B (si el pago de Zero Trust no se resuelve)

Cloudflare Access exige método de pago (aunque sea $0). Alternativa **sin tarjeta**:
un **Cloudflare Worker** con login Google propio (OAuth/OIDC) que sirva el HTML solo
a los 4 emails. Más trabajo de montaje pero gratis. No iniciado; el usuario prefería
primero intentar Access con tarjeta.

## Cómo añadir / quitar un email (cuando Access esté activo)

Zero Trust → Access → Applications → "Cabriñana cuadro de mando" → Policies →
"Familia Cabriñana" → Edit → editar la regla **Emails** → Save. Efecto inmediato,
sin tocar código ni redesplegar.

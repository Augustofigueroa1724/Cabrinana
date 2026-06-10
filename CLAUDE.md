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

## Estado actual (2026-06-08) — ✅ COMPLETADO

- [x] **Tarea 1** — Localizado el HTML original (`Cabriñana - cuadro de mando.html`).
- [x] **Tarea 2** — Repo preparado: `index.html` (copia exacta), `.gitignore`,
      `README.md`. Commit y push a `main` hechos.
- [x] **Tarea 3** — Prerequisitos: node v22, git, wrangler 4.x OK (gh no instalado,
      no necesario).
- [x] **Tarea 4** — Cloudflare Pages creado vía **conexión Git** (opción a).
      Desplegado y verificado en navegador: https://cabrinana.pages.dev muestra el
      dashboard.
- [x] **Tarea 5** — Google como Identity Provider en Cloudflare Access. Resuelto el
      error de pago (Zero Trust Free activo, team `cabrinana`). IdP Google creado en
      **Integrations → Identity providers** (panel nuevo "Cloudflare One"); botón
      **Test** → "Your connection works!". Nota: en el panel nuevo los login methods
      NO están en Settings, sino en **Integrations**.
- [x] **Tarea 6** — Aplicación **self-hosted** en **Access controls → Applications**
      sobre `cabrinana.pages.dev`, solo IdP Google, policy **Allow** "Familia
      Cabrinana" con regla **Include → Emails** (los 4 correos). Página de bloqueo con
      el texto indicado.
- [x] **Tarea 7** — Verificado en **incógnito**: sin login NO se ve el dashboard
      (pide login Google); con un correo autorizado entra. Access bloqueando OK.

### Notas del panel nuevo (Cloudflare One, jun-2026)
- Login methods / IdP → **Integrations** (no en Settings → Authentication, que ya no existe).
- Aplicaciones y policies → **Access controls → Applications**.
- Al crear la app, el campo **Domain** es un menú que ya ofrece `cabrinana.pages.dev`
  completo → seleccionarlo y dejar **Subdomain** vacío.

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

## Troubleshooting: un cambio no aparece en producción

Síntoma (visto 2026-06-10): se hace push a `main` con un cambio visible pero el
sitio sigue mostrando lo viejo, incluso en incógnito y con `?v=N` (descarta caché).

Causa real: el proyecto de Cloudflare Pages **se había desconectado de GitHub**
("This project is disconnected from your Git account"), así que los push **no
disparaban despliegues nuevos** y producción quedaba congelada en el primer deploy.

Diagnóstico/solución:
1. dash.cloudflare.com (panel normal, NO Zero Trust) → Workers & Pages → `cabrinana`
   → pestaña **Deployments**. Si no hay despliegues nuevos tras tus push → desconexión.
2. Settings → Builds & deployments → **Reconnect / Connect to Git** y reautorizar la
   app de Cloudflare en GitHub para `Augustofigueroa1724/Cabrinana`.
3. Forzar un deploy: `git commit --allow-empty -m "redeploy" && git push`.
4. Verificar que aparece una fila nueva en Deployments → Success, y el cambio en el sitio.

Nota: Cloudflare Pages NO usa GitHub Actions (la pestaña Actions queda vacía); usa su
propia app + webhooks. La señal en GitHub es la sección **Deployments/Environments**.

## Asistente "Pregúntame!" (chatbot RAG sobre /docs)

Añadido un chatbot que responde en español SOLO con la info de los documentos de
`docs/`. Decisiones del usuario: motor **Claude API (Anthropic)**, documentos
**PDF/Word**.

Arquitectura:
- **Frontend:** widget (botón flotante "Pregúntame!" + ventana de chat) embebido
  al final del HTML (`Cabriñana - cuadro de mando.html` e `index.html`). Llama por
  `fetch` a `/api/chat`.
- **Backend:** `functions/api/chat.js` (Cloudflare Pages Function). Llama a
  `https://api.anthropic.com/v1/messages` con `x-api-key` = `env.ANTHROPIC_API_KEY`,
  `anthropic-version: 2023-06-01`, modelo `claude-opus-4-8` (override con
  `CHAT_MODEL`). System prompt con anclaje estricto ("responde solo con los
  documentos; si no está, dilo") + caché de prompt sobre el bloque de documentos.
- **Documentos:** `scripts/build-kb.mjs` (deps `pdf-parse`, `mammoth`) extrae el
  texto de `docs/*.{pdf,docx,txt,md}` y genera `functions/api/kb.js` con `KB` y
  `FILES`. Se ejecuta en el build (`npm run build:kb`). `kb.js` se commitea vacío
  como fallback.

Pendiente / requiere acción del usuario en Cloudflare (panel normal):
1. Añadir secreto **`ANTHROPIC_API_KEY`** en Settings → Variables and Secrets.
2. Poner **Build command** = `npm run build:kb` (output dir `/`).
3. Subir los PDFs/Word a `docs/` y push.

Notas:
- La función `/api/chat` queda protegida por Cloudflare Access (mismo dominio).
- `.doc` antiguo y PDFs escaneados sin OCR no se pueden leer (avisar al usuario).
- Sin documentos o sin clave, el bot responde con un mensaje claro en vez de fallar.

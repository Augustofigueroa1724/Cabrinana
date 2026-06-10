// Cloudflare Pages Function — POST /api/chat
// Responde preguntas en español usando SOLO el contexto de los documentos de /docs.
// La clave de Anthropic se lee del entorno (secreto), nunca va en el HTML.
// Esta ruta queda protegida por Cloudflare Access igual que el resto del sitio.
import { KB, FILES } from "./kb.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-8"; // calidad máxima; cambiar con CHAT_MODEL si se quiere abaratar
const MAX_TURNS = 12;
const MAX_CHARS = 4000;

const INSTRUCTIONS = [
  "Eres el asistente del cuadro de mando financiero de Cabriñana.",
  "Respondes EXCLUSIVAMENTE con la información contenida en los DOCUMENTOS que se incluyen más abajo.",
  "Si la respuesta no está en los documentos, dilo con claridad (por ejemplo: «No tengo esa información en los documentos disponibles.») y NO te la inventes ni uses conocimiento externo.",
  "Responde siempre en español, de forma clara y concisa. Cuando sean cifras, sé preciso.",
  "Estructura SIEMPRE la respuesta así: primero una frase directa que conteste la pregunta; después, en una línea aparte, el detalle o los datos de apoyo (puedes usar listas con guiones).",
  "Da directamente la respuesta final, sin mostrar tu razonamiento interno. Para resaltar puedes usar **negrita** y listas con guiones; no uses otros formatos.",
].join(" ");

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const m of input) {
    if (!m || typeof m.content !== "string") continue;
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = m.content.slice(0, MAX_CHARS).trim();
    if (!content) continue;
    out.push({ role, content });
  }
  // Quedarnos con los últimos turnos y asegurar que empieza por user.
  const trimmed = out.slice(-MAX_TURNS);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

// GET /api/chat -> estado (cuántos documentos hay cargados)
export async function onRequestGet() {
  return json({ ready: KB.length > 0, files: FILES, count: FILES.length });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "El asistente no está configurado todavía (falta la clave de API)." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Petición no válida." }, 400);
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages.length) {
    return json({ error: "No hay ninguna pregunta que responder." }, 400);
  }

  if (!KB) {
    return json({
      answer:
        "Todavía no hay documentos cargados en la carpeta /docs, así que no tengo información sobre la que responder. " +
        "Sube los documentos (PDF o Word) a /docs y vuelve a intentarlo.",
    });
  }

  const model = env.CHAT_MODEL || DEFAULT_MODEL;
  const payload = {
    model,
    max_tokens: 1024,
    system: [
      { type: "text", text: INSTRUCTIONS },
      {
        type: "text",
        text: "DOCUMENTOS DISPONIBLES:\n\n" + KB,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  };

  let resp;
  try {
    resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ error: "No se pudo contactar con el servicio de IA. Inténtalo de nuevo." }, 502);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    console.error("Anthropic API error", resp.status, detail);
    const friendly =
      resp.status === 401 || resp.status === 403
        ? "El asistente no está autorizado (revisa la clave de API)."
        : "El servicio de IA devolvió un error. Inténtalo de nuevo en un momento.";
    return json({ error: friendly }, 502);
  }

  const data = await resp.json().catch(() => null);
  const answer =
    data && Array.isArray(data.content)
      ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim()
      : "";

  if (!answer) {
    return json({ error: "No he podido generar una respuesta. Inténtalo de nuevo." }, 502);
  }

  return json({ answer });
}

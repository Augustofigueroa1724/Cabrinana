// Cloudflare Pages Function — POST /api/chat
// Responde en español. Dos fuentes con separación estricta:
//   1) DOCUMENTOS de /docs  -> únicos datos de la explotación Cabriñana.
//   2) Búsqueda web (herramienta nativa de Anthropic) -> SOLO contexto agrícola
//      general: precios de mercado, subvenciones/PAC, normativa y tendencias.
// Ningún dato de la explotación puede venir de internet.
// La clave de Anthropic se lee del entorno (secreto). Ruta protegida por Access.
import { KB, FILES } from "./kb.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-8"; // override con CHAT_MODEL
const MAX_TURNS = 12;
const MAX_CHARS = 4000;
const WEB_TOOL = { type: "web_search_20260209", name: "web_search", max_uses: 5 };

const INSTRUCTIONS = [
  "Eres el asistente del cuadro de mando financiero de la explotación agrícola Cabriñana.",
  "Tienes DOS fuentes de información y debes mantenerlas separadas con rigor:",
  "(1) Los DOCUMENTOS de la explotación que aparecen más abajo. (2) La búsqueda web.",
  "REGLA ABSOLUTA: cualquier dato concreto de la explotación Cabriñana (resultados, cuenta de pérdidas y ganancias, ingresos, gastos, subvenciones cobradas, rendimientos, márgenes, superficies, precios obtenidos o cualquier cifra propia) procede ÚNICAMENTE de los DOCUMENTOS. NUNCA busques en internet datos de la explotación ni uses información externa para responder sobre nuestras cifras. Si un dato de la explotación no está en los documentos, di que no está disponible; no lo busques fuera ni lo inventes.",
  "Usa la búsqueda web SOLO para contexto agrícola general y de mercado: precios y cotizaciones de productos (trigo duro, cebada, avena, aceite de oliva, etc.), subvenciones y PAC, normativa agraria, clima/campaña a nivel sectorial, y tendencias o noticias del sector. Para esos temas, busca información actual.",
  "Cuando un dato venga de internet, deja claro que es información externa/de mercado y nunca lo presentes como si fuera de la explotación. Cuando combines ambas fuentes, separa claramente lo nuestro (documentos) de lo del mercado (web).",
  "No respondas temas ajenos a la agricultura o a la explotación; si te preguntan algo fuera de ese ámbito, indícalo brevemente.",
  "Responde siempre en español, de forma clara y concisa. Con cifras, sé preciso.",
  "Antes de responder, comprueba los datos y verifica que la conclusión es correcta; al comparar cifras identifica bien el máximo o el mínimo. NUNCA muestres correcciones, dudas ni frases del tipo «corrijo» en la respuesta: da directamente la conclusión correcta.",
  "Estructura SIEMPRE la respuesta así: primero una frase directa que conteste la pregunta; después, en una línea aparte, el detalle o los datos de apoyo (puedes usar listas con guiones).",
  "Para resaltar puedes usar **negrita** y listas con guiones; no uses otros formatos.",
  "Cuando la respuesta compare una serie de valores (por ejemplo una magnitud a lo largo de varias campañas o entre cultivos), añade al final un gráfico de barras. Formato EXACTO: una línea con tres comillas invertidas seguidas de la palabra chart, después un JSON con esta forma {\"type\":\"bar\",\"title\":\"Título corto\",\"unit\":\"€/Ha\",\"data\":[{\"label\":\"2021/22\",\"value\":1139.23},{\"label\":\"2022/23\",\"value\":3686.57}]}, y otra línea con tres comillas invertidas. En el JSON usa punto decimal y nunca separador de miles. No incluyas gráfico si no hay una serie de valores comparable.",
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
  const trimmed = out.slice(-MAX_TURNS);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

function extractText(data) {
  if (!data || !Array.isArray(data.content)) return "";
  return data.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
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
        "Todavía no hay documentos cargados en la carpeta /docs, así que no tengo información de la explotación. " +
        "Sube los documentos (PDF o Word) a /docs y vuelve a intentarlo.",
    });
  }

  const model = env.CHAT_MODEL || DEFAULT_MODEL;
  const effort = env.CHAT_EFFORT || "low"; // low = razonamiento más rápido; medium/high = más fino
  const system = [
    { type: "text", text: INSTRUCTIONS },
    { type: "text", text: "DOCUMENTOS DISPONIBLES:\n\n" + KB, cache_control: { type: "ephemeral" } },
  ];

  // Bucle por si la búsqueda web agota el límite de iteraciones del servidor (pause_turn).
  let convo = messages;
  let data = null;
  for (let i = 0; i < 4; i++) {
    const payload = {
      model,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system,
      messages: convo,
      tools: [WEB_TOOL],
    };
    // El parámetro effort acelera/afina el razonamiento; Haiku no lo admite.
    if (!/haiku/i.test(model)) payload.output_config = { effort };

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

    data = await resp.json().catch(() => null);
    if (!data) return json({ error: "Respuesta no válida del servicio de IA." }, 502);

    if (data.stop_reason === "pause_turn" && Array.isArray(data.content)) {
      convo = convo.concat([{ role: "assistant", content: data.content }]);
      continue; // reanudar la búsqueda web
    }
    break;
  }

  const answer = extractText(data);
  if (!answer) {
    return json({ error: "No he podido generar una respuesta. Inténtalo de nuevo." }, 502);
  }

  return json({ answer });
}

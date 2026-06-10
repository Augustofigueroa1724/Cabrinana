// Extrae el texto de los documentos de /docs (PDF, Word, texto) y lo empaqueta
// en functions/api/kb.js para que la función del chat lo use como contexto.
// Se ejecuta en el build de Cloudflare Pages (comando: npm run build:kb).
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
// Acepta tanto docs/ como Docs/ (Linux distingue mayúsculas) por si se sube a cualquiera.
const DOCS_DIRS = ["docs", "Docs"];
const OUT_FILE = path.join(ROOT, "functions", "api", "kb.js");

async function extractPdf(buffer) {
  // Import directo del parser para evitar el self-test de pdf-parse.
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractDocx(buffer) {
  const { default: mammoth } = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

async function listDocs() {
  const found = new Map(); // nombre -> ruta completa (dedupe entre docs/ y Docs/)
  for (const dir of DOCS_DIRS) {
    try {
      const entries = await readdir(path.join(ROOT, dir), { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && !found.has(e.name)) found.set(e.name, path.join(ROOT, dir, e.name));
      }
    } catch {
      // carpeta inexistente: ignorar
    }
  }
  return [...found.entries()].map(([name, full]) => ({ name, full }));
}

function cleanText(t) {
  return t.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function main() {
  const docs = await listDocs();
  const parts = [];
  const files = [];

  for (const { name, full } of docs) {
    if (name.toLowerCase() === "readme.md") continue; // nota de instrucciones, no es fuente
    const ext = path.extname(name).toLowerCase();
    try {
      let text = "";
      if (ext === ".pdf") {
        text = await extractPdf(await readFile(full));
      } else if (ext === ".docx") {
        text = await extractDocx(await readFile(full));
      } else if (ext === ".txt" || ext === ".md") {
        text = (await readFile(full, "utf8"));
      } else if (ext === ".doc") {
        console.warn(`[kb] Saltado ${name}: el formato .doc antiguo no se soporta, guárdalo como .docx o .pdf.`);
        continue;
      } else {
        continue; // ignorar README.md de instrucciones y otros
      }
      text = cleanText(text);
      if (!text) {
        console.warn(`[kb] ${name}: sin texto extraíble (¿PDF escaneado sin OCR?).`);
        continue;
      }
      parts.push(`===== DOCUMENTO: ${name} =====\n${text}`);
      files.push(name);
      console.log(`[kb] OK ${name} (${text.length} caracteres)`);
    } catch (err) {
      console.warn(`[kb] Error procesando ${name}: ${err && err.message}`);
    }
  }

  const kb = parts.join("\n\n");
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  const out =
    "// Archivo generado automáticamente por scripts/build-kb.mjs. No editar a mano.\n" +
    `export const FILES = ${JSON.stringify(files)};\n` +
    `export const KB = ${JSON.stringify(kb)};\n`;
  await writeFile(OUT_FILE, out, "utf8");
  console.log(`[kb] Generado ${path.relative(ROOT, OUT_FILE)} con ${files.length} documento(s), ${kb.length} caracteres.`);
}

main().catch((err) => {
  console.error("[kb] Fallo:", err);
  process.exit(1);
});

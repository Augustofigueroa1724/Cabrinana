# Documentos fuente del asistente "Pregúntame!"

Sube aquí los documentos que el chatbot del cuadro de mando podrá consultar.

## Formatos admitidos
- **PDF** (`.pdf`) — con texto seleccionable. Los PDF escaneados (imagen) sin OCR no se pueden leer.
- **Word** (`.docx`) — el formato antiguo `.doc` no se admite; guárdalo como `.docx` o PDF.
- **Texto** (`.txt`, `.md`).

## Cómo añadir o actualizar la información del chatbot
1. Sube o reemplaza los archivos en esta carpeta `docs/`.
2. Haz `commit` y `push` a `main` (o súbelos por la web de GitHub).
3. En el build, Cloudflare extrae el texto (`npm run build:kb`) y el asistente lo usará automáticamente.

> El asistente responde **solo** con lo que esté en estos documentos. Si algo no está aquí, dirá que no tiene esa información.

Este `README.md` es solo una nota; no se incluye como fuente del chatbot.

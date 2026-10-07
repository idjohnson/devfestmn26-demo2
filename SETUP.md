# Setup

A Node.js app that uploads a medical PDF, extracts its text, and asks an Ollama model for a summary or evaluation.

## Prerequisites
- An Ollama endpoint with models pulled, e.g. `ollama pull gemma4:e4b` and `ollama pull medgemma1.5:4b`
- Node.js 20+ (local run) or Docker
- If running locally without Docker, `poppler-utils` (`pdftoppm`) and `tesseract-ocr` are required for OCR fallback on scanned documents (e.g. `sudo apt install poppler-utils tesseract-ocr tesseract-ocr-eng`). In Docker, these are pre-installed.

## Configuration (env vars)
| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` (Docker image: `http://host.docker.internal:11434`) | Ollama endpoint |
| `OLLAMA_MODEL_FAST` | `gemma4:e4b` | Model name for FAST option (default) |
| `OLLAMA_MODEL_DETAILED` | `medgemma1.5:4b` | Model name for DETAILED option |
| `MAX_CHARS` | `24000` | Max PDF characters sent to the model |
| `PORT` | `3000` | HTTP port |

## Run locally
```bash
npm ci
npm start
npm test
```
Open http://localhost:3000, upload a PDF, choose FAST (default) or DETAILED, and click **Summarize** or **Evaluate**.
API:
- Summarize (default FAST): `curl -F pdf=@report.pdf http://localhost:3000/api/summarize`
- Summarize (DETAILED): `curl -F pdf=@report.pdf -F mode=DETAILED http://localhost:3000/api/summarize`
- Evaluate: `curl -F pdf=@report.pdf http://localhost:3000/api/evaluate` (or `-F action=evaluate`)

## Build and run with Docker
```bash
docker build -t medical-pdf-summarizer .
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL_FAST=gemma4:e4b \
  -e OLLAMA_MODEL_DETAILED=medgemma1.5:4b \
  medical-pdf-summarizer
```

## GitHub Container Registry
`.github/workflows/docker-publish.yml` builds and pushes `ghcr.io/<owner>/<repo>` on pushes to `main` and `v*` tags (uses `GITHUB_TOKEN`; no extra secrets). Pull with:
```bash
docker pull ghcr.io/idjohnson/devfestmn26-demo2:latest
```

> Disclaimer: summaries are AI-generated, informational only, and not medical advice.

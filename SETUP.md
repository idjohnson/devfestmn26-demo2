# Setup

A Node.js app that uploads a medical PDF, extracts its text, and asks an Ollama model for a summary.

## Prerequisites
- An Ollama endpoint with a model pulled, e.g. `ollama pull llama3.1`
- Node.js 20+ (local run) or Docker
- If running locally without Docker, `poppler-utils` (`pdftoppm`) and `tesseract-ocr` are required for OCR fallback on scanned documents (e.g. `sudo apt install poppler-utils tesseract-ocr tesseract-ocr-eng`). In Docker, these are pre-installed.

## Configuration (env vars)
| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` (Docker image: `http://host.docker.internal:11434`) | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.1` | Model name |
| `MAX_CHARS` | `24000` | Max PDF characters sent to the model |
| `PORT` | `3000` | HTTP port |

## Run locally
```bash
npm ci
npm start
npm test
```
Open http://localhost:3000, upload a PDF. API: `curl -F pdf=@report.pdf http://localhost:3000/api/summarize`

## Build and run with Docker
```bash
docker build -t medical-pdf-summarizer .
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL=llama3.1 \
  medical-pdf-summarizer
```

## GitHub Container Registry
`.github/workflows/docker-publish.yml` builds and pushes `ghcr.io/<owner>/<repo>` on pushes to `main` and `v*` tags (uses `GITHUB_TOKEN`; no extra secrets). Pull with:
```bash
docker pull ghcr.io/idjohnson/devfestmn26-demo2:latest
```

> Disclaimer: summaries are AI-generated, informational only, and not medical advice.

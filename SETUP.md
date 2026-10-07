# Setup

A Node.js app that uploads a medical PDF, extracts its text, and asks an Ollama model for a summary or evaluation. Features Google federated OpenID Connect (OIDC) authentication, fast/detailed model selection, downloadable text summaries, and printable GRADE Standard Assessment dossiers.

## Prerequisites
- An Ollama endpoint with models pulled, e.g. `ollama pull gemma4:e4b` and `ollama pull medgemma1.5:4b`
- Node.js 20+ (local run) or Docker
- If running locally without Docker, `poppler-utils` (`pdftoppm`) and `tesseract-ocr` are required for OCR fallback on scanned documents (e.g. `sudo apt install poppler-utils tesseract-ocr tesseract-ocr-eng`). In Docker, these are pre-installed.
- Google Cloud project with OAuth 2.0 / OIDC credentials (for Google federated login)

## Configuration (env vars)
| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` (Docker image: `http://host.docker.internal:11434`) | Ollama endpoint |
| `OLLAMA_MODEL_FAST` | `gemma4:e4b` | Model name for FAST option (default) |
| `OLLAMA_MODEL_DETAILED` | `medgemma1.5:4b` | Model name for DETAILED option |
| `MAX_CHARS` | `24000` | Max PDF characters sent to the model |
| `PORT` | `3000` | HTTP port |
| `GOOGLE_CLIENT_ID` | `""` | Google Cloud OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | `""` | Google Cloud OAuth 2.0 Web Client Secret |
| `GOOGLE_REDIRECT_URI` | `""` (defaults to `http://<host>/auth/google/callback`) | OIDC Authorized Redirect Callback URI |
| `SESSION_SECRET` | `dev-insecure-session-secret-change-in-prod` | HMAC secret key used for signing session cookies |

---

## Google Federated IdP Setup (OIDC)

The application uses OpenID Connect (OIDC) to federate authentication to Google Identity Services. The initial landing page presents a **Sign in with Google** interface. After federating out to Google and back, the authenticated user's **Name** and status are displayed in the upper-right header.

Follow these steps to set up Google as your identity provider:

### Step 1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **New Project**.
3. Name your project (e.g. `aevitasmed-evidence-engine`) and click **Create**.

### Step 2: Configure the OAuth Consent Screen
1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen**.
2. Select the **User Type**:
   - **Internal**: Recommended if you use Google Workspace (restricts sign-in to users within your organization/hospital).
   - **External**: Allows sign-in from any Google account (requires adding test users while in "Testing" mode).
3. Click **Create** and complete the app registration:
   - **App name**: `AevitasMed Evidence Engine`
   - **User support email**: Select your email address.
   - **Developer contact information**: Provide an email address.
4. Click **Save and Continue**.
5. In the **Scopes** step:
   - Click **Add or Remove Scopes**.
   - Select the following standard OIDC scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Update** and then **Save and Continue**.
6. In the **Test users** step (if configured as External in Testing mode):
   - Click **Add Users** and enter the Google email addresses of clinicians or developers testing the application.
   - Click **Save and Continue**.

### Step 3: Create OAuth 2.0 Client Credentials
1. In the left navigation menu, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. In the **Application type** dropdown, select **Web application**.
4. Name the client (e.g. `Medical Summarizer Web Client`).
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.com` (for production deployment)
6. Under **Authorized redirect URIs**, click **+ Add URI** and add the callback route:
   - `http://localhost:3000/auth/google/callback`
   - `https://your-production-domain.com/auth/google/callback` (for production)
7. Click **Create**.
8. A modal will display your **Client ID** (e.g. `xxxxx.apps.googleusercontent.com`) and **Client Secret**. Copy both values.

### Step 4: Configure Local Environment Variables
Export the credentials into your shell before starting the server:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
export SESSION_SECRET="$(openssl rand -hex 32)"
```

*(Note: If Google credentials are not set in development, the login screen will provide a demo sign-in fallback so you can still test document processing workflows locally).*

---

## Run locally

```bash
npm ci
npm test
npm start
```

1. Open http://localhost:3000.
2. The initial screen displays the **Clinician Access Portal** with **Sign in with Google**.
3. Click **Sign in with Google** to federate out to Google OIDC and authorize.
4. Google returns you to `/auth/google/callback`, establishing a secure signed session cookie.
5. The full application view is revealed with your **Name** displayed in the upper right.
6. Upload a medical PDF, choose **FAST** (default) or **DETAILED**, and click **Summarize** or **Evaluate**.
7. Click **Export PDF** to produce a printable GRADE dossier or **Download Summary** to save the raw text.
8. Click the logout icon in the upper-right to sign out.

### API Usage
Direct API endpoints remain accessible for automated testing and programmatic pipelines:
- Summarize (default FAST): `curl -F pdf=@report.pdf http://localhost:3000/api/summarize`
- Summarize (DETAILED): `curl -F pdf=@report.pdf -F mode=DETAILED http://localhost:3000/api/summarize`
- Evaluate: `curl -F pdf=@report.pdf http://localhost:3000/api/evaluate` (or `-F action=evaluate`)

---

## Build and run with Docker

```bash
docker build -t medical-pdf-summarizer .

docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL_FAST=gemma4:e4b \
  -e OLLAMA_MODEL_DETAILED=medgemma1.5:4b \
  -e GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" \
  -e GOOGLE_CLIENT_SECRET="your-client-secret" \
  -e GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback" \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  medical-pdf-summarizer
```

## GitHub Container Registry
`.github/workflows/docker-publish.yml` builds and pushes `ghcr.io/<owner>/<repo>` on pushes to `main` and `v*` tags (uses `GITHUB_TOKEN`; no extra secrets). Pull with:
```bash
docker pull ghcr.io/idjohnson/devfestmn26-demo2:latest
```

> Disclaimer: summaries are AI-generated, informational only, and not medical advice.

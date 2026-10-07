# Medical PDF Summarizer Helm Chart

A Kubernetes Helm chart for deploying the **Medical PDF Summarizer** application with Ollama backend integration.

## Features

- Configured with environment defaults matching your Docker workflow:
  - `PORT`: `3001`
  - `OLLAMA_URL`: `http://192.168.1.220:11434`
  - `OLLAMA_MODEL_FAST`: `gemma4:12b`
  - `OLLAMA_MODEL_DETAILED`: `medgemma:27b`
- Pre-configured HTTP liveness and readiness health probes pointing to `/health`.
- Support for `hostNetwork` if you wish to run pods directly on the host's network namespace (mirroring `docker run --network host`).
- ConfigMap-driven configuration with automatic checksum rolling updates on deployment.
- Optional Ingress and ServiceAccount support.

## Installing the Chart

### 1. Quick Install (default settings)

```bash
helm install test-medical-summarizer ./chart
```

### 2. Overriding Values at Install Time

You can customize any setting using `--set` or a custom values file:

```bash
helm install test-medical-summarizer ./chart \
  --set app.port=3001 \
  --set app.ollama.url="http://192.168.1.220:11434" \
  --set app.ollama.modelFast="gemma4:12b" \
  --set app.ollama.modelDetailed="medgemma:27b"
```

### 3. Using Host Networking (like Docker `--network host`)

If your Kubernetes node needs to access the Ollama IP directly or bind to the node's network interface:

```bash
helm install test-medical-summarizer ./chart \
  --set hostNetwork=true
```

### 4. Using NodePort Service

If you want to expose the service on a specific node port:

```bash
helm install test-medical-summarizer ./chart \
  --set service.type=NodePort \
  --set service.nodePort=30001
```

## Accessing the Application

If deployed as `ClusterIP` (default):

```bash
# Port-forward to access locally at http://localhost:3001
kubectl port-forward svc/test-medical-summarizer-medical-pdf-summarizer 3001:3001
```

Then visit `http://localhost:3001` in your browser.

## Configuration Parameters

| Parameter | Description | Default |
|---|---|---|
| `replicaCount` | Number of pod replicas | `1` |
| `image.repository` | Image name | `medical-pdf-summarizer` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `hostNetwork` | Run pod on host network namespace | `false` |
| `app.port` | Application HTTP port (`PORT` env var) | `3001` |
| `app.ollama.url` | Ollama service endpoint (`OLLAMA_URL`) | `http://192.168.1.220:11434` |
| `app.ollama.modelFast` | Fast summary model (`OLLAMA_MODEL_FAST`) | `gemma4:12b` |
| `app.ollama.modelDetailed` | Detailed model (`OLLAMA_MODEL_DETAILED`) | `medgemma:27b` |
| `app.maxChars` | Maximum characters sent to Ollama (`MAX_CHARS`) | `24000` |
| `app.extraEnv` | Additional environment variables | `[]` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Port exposed by the service | `3001` |
| `ingress.enabled` | Enable ingress controller resource | `false` |
| `resources` | CPU and memory resource requests/limits | `{}` |
| `livenessProbe` | Health check probe configuration | `/health` endpoint |
| `readinessProbe` | Readiness check probe configuration | `/health` endpoint |

## Uninstalling the Chart

To uninstall / delete the release:

```bash
helm uninstall test-medical-summarizer
```

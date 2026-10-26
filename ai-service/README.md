# BuildExchange AI Forensic Inference Microservice

## Overview
This microservice provides high-throughput, multi-signal synthetic/AI-generated image forensic analysis for the BuildExchange construction material exchange platform.

## Detection Pipeline
1. **Error Level Analysis (ELA):** Measures recompression error discrepancy across JPEG quantization layers.
2. **2D Discrete Fourier Transform (DFT):** Analyzes the 2D power spectrum to detect periodic grid artifacts characteristic of generative diffusion decoders and convolutional upsamplers.
3. **High-Frequency Laplacian Variance:** Evaluates micro-texture surface roughness versus synthetic smoothing.
4. **Metadata & Generator Provenance:** Scans image metadata chunks for AI generator signatures (Midjourney, DALL-E, Stable Diffusion, ComfyUI, etc.).

## Setup & Running Locally

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Pip

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
- `AI_SERVICE_PORT`: Port to listen on (Default: `5001`)
- `AI_SERVICE_SECRET`: Shared secret for internal backend communication (Default: `buildexchange_ai_service_internal_secret_2026`)

### 4. Start the Service
```bash
python app.py
```
The service will start on `http://127.0.0.1:5001`.

## Endpoints

### 1. Health Check
`GET /health`
```json
{
  "status": "OK",
  "service": "BuildExchange AI Image Forensic Microservice",
  "version": "2.1.0",
  "uptime_seconds": 12.4
}
```

### 2. Predict AI-Generated Image
`POST /api/v1/predict-ai-generated`
Headers:
- `x-internal-secret: <AI_SERVICE_SECRET>`
- Body: `multipart/form-data` with `image` file OR JSON `{ "image_url": "https://..." }`

Response:
```json
{
  "success": true,
  "is_ai_generated": false,
  "ai_generated_score": 0.12,
  "confidence": "HIGH",
  "signals": {
    "metadata_signature": false,
    "ela": { "ela_mean": 1.2, "ela_std": 0.8, "high_error_ratio": 0.002 },
    "spectral": { "high_freq_ratio": 0.42, "spectral_peak_ratio": 1.28 },
    "laplacian_variance": 420.5
  },
  "reasons": [
    "Natural tactile surface roughness confirmed (Laplacian variance: 420.5)"
  ],
  "model_version": "BuildExchange-Forensics-Hybrid-v2.1"
}
```

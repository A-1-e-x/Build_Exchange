import os
import io
import time
import urllib.request
from flask import Flask, request, jsonify
from forensic_detector import ImageForensicDetector

app = Flask(__name__)
detector = ImageForensicDetector()

INTERNAL_SECRET = os.environ.get("AI_SERVICE_SECRET", "buildexchange_ai_service_internal_secret_2026")
PORT = int(os.environ.get("AI_SERVICE_PORT", 5001))

START_TIME = time.time()

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "service": "BuildExchange AI Image Forensic Microservice",
        "version": "2.1.0",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "supported_models": [
            "Discrete Fourier Transform Spectral Artifacts (ICML 2020)",
            "Error Level Analysis Discrepancy (ELA)",
            "High-Frequency Laplacian Variance Texture Profiling",
            "Generative Metadata Signature Scanner"
        ]
    }), 200

@app.route("/api/v1/predict-ai-generated", methods=["POST"])
def predict_ai_generated():
    # Security header check (optional in development, enforced if secret configured)
    auth_header = request.headers.get("x-internal-secret")
    if INTERNAL_SECRET and auth_header and auth_header != INTERNAL_SECRET:
        return jsonify({"error": "Unauthorized internal service request"}), 401

    image_bytes = None

    # 1. Direct file upload
    if "image" in request.files:
        file = request.files["image"]
        image_bytes = file.read()
    # 2. JSON payload with image_url or base64
    elif request.is_json:
        data = request.get_json()
        if "image_url" in data:
            url = data["image_url"]
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "BuildExchange-AI/2.1"})
                with urllib.request.urlopen(req, timeout=10) as response:
                    image_bytes = response.read()
            except Exception as e:
                return jsonify({"error": f"Failed to fetch image from URL: {str(e)}"}), 400
        elif "image_base64" in data:
            import base64
            b64_str = data["image_base64"]
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(b64_str)
            except Exception as e:
                return jsonify({"error": f"Invalid base64 payload: {str(e)}"}), 400

    if not image_bytes or len(image_bytes) == 0:
        return jsonify({"error": "No valid image provided via multipart 'image' or JSON 'image_url'"}), 400

    try:
        results = detector.analyze(image_bytes)
        return jsonify({
            "success": True,
            **results
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "ai_generated_score": None,
            "is_ai_generated": False,
            "confidence": "LOW"
        }), 422

if __name__ == "__main__":
    print(f"===========================================================")
    print(f" BuildExchange AI Forensic Inference Microservice")
    print(f" Listening on: http://127.0.0.1:{PORT}")
    print(f"===========================================================")
    app.run(host="0.0.0.0", port=PORT, debug=False)

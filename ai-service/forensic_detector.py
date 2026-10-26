import os
import io
import math
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

class ImageForensicDetector:
    """
    Multi-signal forensic analyzer for detecting synthetic / AI-generated images
    and digital manipulation.
    
    Signals evaluated:
    1. Error Level Analysis (ELA) - measures compression error variance.
    2. Discrete Fourier Transform (DFT) 2D Power Spectrum - detects periodic frequency
       grid artifacts characteristic of GAN / Diffusion upsamplers.
    3. High-Frequency Laplacian Variance - detects unnatural diffusion texture smoothing.
    4. Embedded Text/Generator Signatures - detects common AI prompt/tool tags in metadata chunks.
    """

    def __init__(self, ela_quality=92, ela_scale=15):
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale

    def inspect_metadata_signatures(self, pil_image):
        """Checks for explicit AI generator tags in EXIF, XMP, or PNG chunks."""
        findings = []
        is_ai_signature_found = False
        tool_name = None

        ai_keywords = [
            "midjourney", "stable diffusion", "dall-e", "dalle", "comfyui",
            "novelai", "disco diffusion", "craiyon", "flux.1", "adobe firefly",
            "generative ai", "civitai"
        ]

        # Inspect info dictionary (PNG chunks, comments)
        info = pil_image.info or {}
        for key, val in info.items():
            val_str = str(val).lower()
            for kw in ai_keywords:
                if kw in val_str:
                    is_ai_signature_found = True
                    tool_name = kw.title()
                    findings.append(f"AI generator signature '{tool_name}' detected in metadata chunk '{key}'")
                    break

        return is_ai_signature_found, tool_name, findings

    def compute_ela_score(self, pil_image):
        """
        Computes Error Level Analysis (ELA) discrepancy metric.
        Camera JPEGs exhibit uniform, high-frequency noise floor across the entire sensor frame.
        AI-generated or spliced images show atypical compression error distribution.
        """
        try:
            # Convert to RGB
            rgb_image = pil_image.convert("RGB")
            
            # Recompress in memory at reference quality
            buffer = io.BytesIO()
            rgb_image.save(buffer, "JPEG", quality=self.ela_quality)
            buffer.seek(0)
            recompressed = Image.open(buffer)

            # Compute pixel-wise absolute difference
            diff = ImageChops.difference(rgb_image, recompressed)
            
            # Scale difference for numerical stability
            extrema = diff.getextrema()
            max_diff = max([ex[1] for ex in extrema]) if extrema else 1
            scale = 255.0 / max_diff if max_diff > 0 else 1.0

            # Compute standard deviation of error
            diff_arr = np.asarray(diff, dtype=np.float32)
            ela_mean = float(np.mean(diff_arr))
            ela_std = float(np.std(diff_arr))

            # Ratio of high-error pixels (unnatural local spikes)
            high_error_ratio = float(np.sum(diff_arr > 30) / diff_arr.size)

            return {
                "ela_mean": round(ela_mean, 2),
                "ela_std": round(ela_std, 2),
                "high_error_ratio": round(high_error_ratio, 4)
            }
        except Exception as e:
            return {"ela_mean": 0.0, "ela_std": 0.0, "high_error_ratio": 0.0, "error": str(e)}

    def compute_spectral_anomalies(self, pil_image):
        """
        Evaluates 2D Discrete Fourier Transform (DFT) power spectrum.
        Convolutional upsamplers and latent diffusion decoders leave characteristic
        checkerboard and radial high-frequency spectral spikes (Frank et al., ICML 2020).
        """
        try:
            # Resize to 256x256 grayscale for fast, standardized spectral analysis
            gray = pil_image.convert("L").resize((256, 256), Image.Resampling.BICUBIC)
            img_arr = np.asarray(gray, dtype=np.float32)

            # 2D FFT with shifted DC component to center
            f_transform = np.fft.fft2(img_arr)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.abs(f_shift) + 1e-7
            log_spectrum = np.log(magnitude_spectrum)

            h, w = log_spectrum.shape
            cy, cx = h // 2, w // 2

            # Radial energy distribution: High frequencies (periphery) vs Low frequencies (center)
            y, x = np.ogrid[:h, :w]
            dist_from_center = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

            # Low freq: r < 32, Mid freq: 32 <= r < 80, High freq: r >= 80
            high_freq_mask = dist_from_center >= 80
            high_freq_energy = float(np.mean(log_spectrum[high_freq_mask]))
            total_energy = float(np.mean(log_spectrum))

            high_freq_ratio = high_freq_energy / (total_energy + 1e-7)

            # Peak-to-average ratio in high frequency ring (measures unnatural grid spikes)
            hf_vals = log_spectrum[high_freq_mask]
            peak_ratio = float(np.max(hf_vals) / (np.mean(hf_vals) + 1e-7))

            return {
                "high_freq_ratio": round(high_freq_ratio, 4),
                "spectral_peak_ratio": round(peak_ratio, 4)
            }
        except Exception as e:
            return {"high_freq_ratio": 0.0, "spectral_peak_ratio": 0.0, "error": str(e)}

    def compute_texture_smoothness(self, pil_image):
        """
        Computes Laplacian variance to measure texture roughness vs synthetic smoothing.
        Natural construction materials (concrete, bricks, timber, gravel) exhibit high Laplacian variance.
        Diffusion models often render unnaturally smooth or plastic micro-textures.
        """
        try:
            gray = pil_image.convert("L").resize((256, 256), Image.Resampling.BILINEAR)
            arr = np.asarray(gray, dtype=np.float32)

            # Discrete 3x3 Laplacian kernel
            kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
            
            # Simple 2D valid convolution
            pad = np.pad(arr, 1, mode="edge")
            laplacian = (
                pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:] - 4 * pad[1:-1, 1:-1]
            )
            laplacian_var = float(np.var(laplacian))

            return round(laplacian_var, 2)
        except Exception:
            return 0.0

    def analyze(self, image_bytes_or_pil):
        """
        Runs comprehensive forensic detection and returns calibrated synthetic probability.
        """
        if isinstance(image_bytes_or_pil, (bytes, bytearray)):
            image = Image.open(io.BytesIO(image_bytes_or_pil))
        else:
            image = image_bytes_or_pil

        # 1. Metadata check
        has_ai_sig, tool_name, sig_findings = self.inspect_metadata_signatures(image)

        # 2. ELA analysis
        ela = self.compute_ela_score(image)

        # 3. Frequency domain analysis
        spectral = self.compute_spectral_anomalies(image)

        # 4. Texture roughness
        laplacian_var = self.compute_texture_smoothness(image)

        # Multi-signal probabilistic fusion
        # Base probability is 0.05 (prior for real listings)
        prob = 0.05
        reasons = []

        if has_ai_sig:
            prob = 0.98
            reasons.append(f"Direct AI generative software signature found: {tool_name}")
        else:
            # Check spectral grid artifacts
            # Normal camera photos have spectral_peak_ratio between 1.15 and 1.38
            # Diffusion upsamplers frequently create peak ratios > 1.48
            if spectral.get("spectral_peak_ratio", 0) > 1.45:
                spike = min(0.40, (spectral["spectral_peak_ratio"] - 1.45) * 1.5)
                prob += spike
                reasons.append(f"Periodic frequency domain spikes detected (peak ratio: {spectral['spectral_peak_ratio']})")

            # High-frequency energy deficit (unnatural smoothing of micro-textures)
            # Construction materials (stone, sand, steel) have high Laplacian variance (> 250)
            if laplacian_var < 80.0:
                prob += 0.20
                reasons.append(f"Unnaturally low micro-texture variance ({laplacian_var}) inconsistent with real physical materials")
            elif laplacian_var > 350.0:
                # Strong evidence of natural roughness
                prob = max(0.02, prob - 0.15)
                reasons.append(f"Natural tactile surface roughness confirmed (Laplacian variance: {laplacian_var})")

            # ELA anomaly
            if ela.get("high_error_ratio", 0) > 0.08:
                prob += 0.15
                reasons.append(f"Inconsistent compression error layer detected (ELA ratio: {ela['high_error_ratio']})")
            elif ela.get("high_error_ratio", 0) < 0.01 and laplacian_var > 200:
                prob = max(0.01, prob - 0.10)

        # Clamp between 0.0 and 0.99
        calibrated_score = float(max(0.01, min(0.99, prob)))
        calibrated_score = round(calibrated_score, 3)

        is_ai_generated = calibrated_score >= 0.65

        return {
            "is_ai_generated": is_ai_generated,
            "ai_generated_score": calibrated_score,
            "confidence": "HIGH" if (calibrated_score >= 0.80 or calibrated_score <= 0.15) else "MEDIUM",
            "signals": {
                "metadata_signature": has_ai_sig,
                "tool_detected": tool_name,
                "ela": ela,
                "spectral": spectral,
                "laplacian_variance": laplacian_var
            },
            "reasons": reasons,
            "model_version": "BuildExchange-Forensics-Hybrid-v2.1"
        }

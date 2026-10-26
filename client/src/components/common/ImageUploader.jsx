import React, { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ImageUploader = ({
  images = [],
  onChange,
  maxFiles = 5,
  existingImages = [],
  onRemoveExisting,
}) => {
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFilesSelected = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const totalAllowed = maxFiles - (existingImages.length + images.length);
    if (selectedFiles.length > totalAllowed) {
      showToast(`You can upload a maximum of ${maxFiles} images in total.`, 'warning');
    }

    const validFiles = [];
    for (const file of selectedFiles.slice(0, totalAllowed)) {
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} is not an image file!`, 'error');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} exceeds the 5MB file size limit.`, 'warning');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewFile = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalCurrent = existingImages.length + images.length;

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      {totalCurrent < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelected}
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Click to select construction material images
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports JPG, PNG, WEBP up to 5MB each (Max {maxFiles} images)
            </p>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {/* Existing images (from backend during edit) */}
          {existingImages.map((img, idx) => (
            <div
              key={`existing-${idx}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group bg-slate-100"
            >
              <img
                src={img.url}
                alt={`Uploaded ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                  Cover
                </span>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Newly selected images before upload */}
          {images.map((file, idx) => {
            const previewUrl = URL.createObjectURL(file);
            const isFirst = existingImages.length === 0 && idx === 0;

            return (
              <div
                key={`new-${idx}`}
                className="relative aspect-square rounded-xl overflow-hidden border border-amber-300 shadow-sm group bg-slate-100"
              >
                <img
                  src={previewUrl}
                  alt={`New upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isFirst && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold shadow-sm">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeNewFile(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  aria-label="Remove preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

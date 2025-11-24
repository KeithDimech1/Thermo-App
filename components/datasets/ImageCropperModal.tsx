'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

interface ImageCropperModalProps {
  imageUrl: string;
  imageName: string;
  datasetId: number;
  fileId: number;
  onClose: () => void;
  onSave: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropperModal({
  imageUrl,
  imageName,
  datasetId,
  fileId,
  onClose,
  onSave
}: ImageCropperModalProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw canvas with crop selection
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    // Draw crop area overlay
    if (cropArea.width > 0 && cropArea.height > 0) {
      // Darken outside area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, cropArea.y); // Top
      ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height); // Left
      ctx.fillRect(cropArea.x + cropArea.width, cropArea.y, canvas.width - (cropArea.x + cropArea.width), cropArea.height); // Right
      ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height - (cropArea.y + cropArea.height)); // Bottom

      // Draw selection box border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  }, [cropArea, imageLoaded]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setStartPoint({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCropArea({
      x: width < 0 ? currentX : startPoint.x,
      y: height < 0 ? currentY : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!imageRef.current || cropArea.width === 0 || cropArea.height === 0) {
      alert('Please select an area to crop');
      return;
    }

    setIsLoading(true);

    try {
      // Create a temporary canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropArea.width;
      cropCanvas.height = cropArea.height;
      const cropCtx = cropCanvas.getContext('2d');

      if (!cropCtx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw cropped area
      cropCtx.drawImage(
        imageRef.current,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      // Convert to base64 with JPEG compression for smaller file size
      const croppedImageData = cropCanvas.toDataURL('image/jpeg', 0.9);

      console.log('[Crop] Starting upload...', {
        datasetId,
        fileId,
        imageName,
        dataSize: croppedImageData.length
      });

      // Upload via API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`/api/datasets/${datasetId}/crop-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          croppedImageData,
          originalFileName: imageName
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[Crop] Response received:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to crop image');
      }

      await response.json();

      // Notify parent component
      onSave();
      onClose();

    } catch (error: any) {
      console.error('[Crop] Error:', error);

      let errorMessage = 'Failed to crop image';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The image might be too large. Try selecting a smaller area.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t('cropImage')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <p className="text-sm text-gray-600 mb-4">
              {t('cropInstructions')}
            </p>

            <div className="flex justify-center bg-gray-100 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full h-auto cursor-crosshair border-2 border-gray-300"
                style={{ maxHeight: '60vh' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              disabled={isLoading}
            >
              {t('cancelCrop')}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || cropArea.width === 0 || cropArea.height === 0}
            >
              {isLoading ? t('croppingImage') : t('saveCrop')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

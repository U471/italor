import { useState } from 'react';

/**
 * ImageGallery — displays fabric swatch images with zoom-on-hover.
 * Falls back to emoji placeholder when no images are available.
 *
 * Props:
 *  - images: string[]       Array of image URLs
 *  - thumbnailUrl: string   Legacy single image fallback
 *  - name: string           Fabric name (used for alt text)
 */
function ImageGallery({ images = [], thumbnailUrl = null, name = '' }) {
  // Build an ordered list: prefer images array, fall back to thumbnailUrl, then placeholder
  const allImages = images.length > 0 ? images : thumbnailUrl ? [thumbnailUrl] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const activeImage = allImages[activeIndex] || null;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in select-none"
        onMouseEnter={() => activeImage && setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        aria-label={`${name} swatch`}
      >
        {activeImage ? (
          <img
            src={activeImage}
            alt={name}
            className="w-full h-full object-cover"
            style={
              isZoomed
                ? {
                    transform: 'scale(2)',
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: 'transform-origin 0s',
                  }
                : { transform: 'scale(1)', transition: 'transform 0.2s ease' }
            }
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-7xl select-none" aria-hidden="true">🧵</span>
            <p className="mt-3 text-sm font-medium">{name}</p>
          </div>
        )}

        {/* Zoom hint */}
        {activeImage && !isZoomed && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg pointer-events-none">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="fabric images">
          {allImages.map((img, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? 'border-gray-900 opacity-100'
                  : 'border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;

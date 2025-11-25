import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const LightboxViewer = ({
  isOpen,
  images,
  currentIndex,
  zoom,
  rotate,
  onClose,
  onPrevImage,
  onNextImage,
  onSelectImage,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}) => {
  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-black/90 cursor-pointer" onClick={onClose} />

      {/* Main Image */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <img
          src={images[currentIndex]?.image_url}
          alt="lightbox"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        />
      </div>

      {/* Control Buttons - Top Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoomOut();
          }}
          disabled={zoom <= 0.5}
          className="bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-800 rounded-full p-2 shadow-lg transition"
          title="Thu nhỏ"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoomIn();
          }}
          disabled={zoom >= 3}
          className="bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-800 rounded-full p-2 shadow-lg transition"
          title="Phóng to"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition"
          title="Xoay 90°"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition"
          title="Đặt lại"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition mt-2"
          title="Đóng"
        >
          <AiOutlineClose className="text-lg" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 shadow-lg z-20 pointer-events-auto"
            title="Ảnh trước"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={onNextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 shadow-lg z-20 pointer-events-auto"
            title="Ảnh tiếp"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Thumbnails */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto z-20 pointer-events-auto">
        {images.map((img, idx) => (
          <button
            key={img.image_id}
            onClick={() => onSelectImage(idx)}
            className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition ${
              currentIndex === idx ? 'border-white' : 'border-white/40 hover:border-white/60'
            }`}
          >
            <img src={img.image_url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-20 bg-white/20 text-white px-3 py-1 rounded text-sm font-semibold">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default LightboxViewer;

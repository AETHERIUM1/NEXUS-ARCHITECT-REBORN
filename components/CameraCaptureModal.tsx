import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose }) => {
  const { setUploadedFiles, setCameraModalOpen } = useContext(AppContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (isOpen) {
        setError(null);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setError("Could not access the camera. Please ensure permissions are granted in your browser settings.");
          if (err instanceof Error && err.name === "NotAllowedError") {
            setError("Camera access was denied. Please grant permission and try again.");
          }
        }
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop camera stream when component unmounts or modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
        setUploadedFiles(prev => [...prev, file]);
        setCameraModalOpen(false); // Close modal on success
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Take Photo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
            {error ? (
                <div className="p-4 bg-red-900/50 text-red-300 rounded-lg">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleCapture} disabled={!!error} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
};

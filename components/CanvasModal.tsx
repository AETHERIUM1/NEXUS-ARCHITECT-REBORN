import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

interface CanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanvasModal: React.FC<CanvasModalProps> = ({ isOpen, onClose }) => {
  const { setUploadedFiles, setCanvasModalOpen } = useContext(AppContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
        clearCanvas();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.nativeEvent instanceof MouseEvent) {
      return { x: e.nativeEvent.clientX - rect.left, y: e.nativeEvent.clientY - rect.top };
    }
    if (e.nativeEvent instanceof TouchEvent) {
      return { x: e.nativeEvent.touches[0].clientX - rect.left, y: e.nativeEvent.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoords(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const endDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.fillStyle = '#1e293b'; // slate-800
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });
          setUploadedFiles(prev => [...prev, file]);
          setCanvasModalOpen(false);
        }
      }, 'image/png');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Canvas</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div className="w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full"
              onMouseDown={startDrawing}
              onMouseUp={endDrawing}
              onMouseMove={draw}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={endDrawing}
              onTouchMove={draw}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
                <label htmlFor="color-picker" className="text-sm font-medium text-slate-300">Color:</label>
                <input type="color" id="color-picker" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
            </div>
            <div className="flex items-center gap-2 flex-grow max-w-xs">
                <label htmlFor="brush-size" className="text-sm font-medium text-slate-300">Size:</label>
                <input type="range" id="brush-size" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
            </div>
            <button onClick={clearCanvas} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">Clear</button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Submit Drawing</button>
        </div>
      </div>
    </div>
  );
};

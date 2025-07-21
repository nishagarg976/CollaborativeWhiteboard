import { useEffect, useRef, useState, useCallback } from 'react';
import { DrawingTool, Point, DrawingCommand, StrokeData } from '../types/whiteboard';

interface DrawingCanvasProps {
  tool: DrawingTool;
  drawingData: DrawingCommand[];
  onDrawingCommand: (command: Omit<DrawingCommand, 'userId' | 'timestamp'>) => void;
  onCursorMove: (position: Point | null) => void;
}

export default function DrawingCanvas({ tool, drawingData, onDrawingCommand, onCursorMove }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.imageSmoothingEnabled = true;
    contextRef.current = context;

    // Redraw all existing strokes
    redrawCanvas();
  }, []);

  // Redraw canvas when drawing data changes
  useEffect(() => {
    redrawCanvas();
  }, [drawingData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;

      const rect = canvas.parentElement.getBoundingClientRect();
      
      // Save the current drawing
      const imageData = canvas.toDataURL();
      
      // Resize canvas
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Restore the drawing
      const img = new Image();
      img.onload = () => {
        contextRef.current?.drawImage(img, 0, 0);
      };
      img.src = imageData;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    drawingData.forEach((command) => {
      if (command.type === 'stroke' && command.data) {
        drawStroke(command.data);
      }
    });
  };

  const drawStroke = (strokeData: StrokeData) => {
    const context = contextRef.current;
    if (!context || strokeData.points.length < 2) return;

    context.beginPath();
    context.strokeStyle = strokeData.color;
    context.lineWidth = strokeData.strokeWidth;

    context.moveTo(strokeData.points[0].x, strokeData.points[0].y);
    
    for (let i = 1; i < strokeData.points.length; i++) {
      context.lineTo(strokeData.points[i].x, strokeData.points[i].y);
    }
    
    context.stroke();
  };

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setCurrentStroke([point]);

    const context = contextRef.current;
    if (!context) return;

    context.beginPath();
    context.strokeStyle = tool.color;
    context.lineWidth = tool.strokeWidth;
    context.moveTo(point.x, point.y);
  }, [tool, getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    const context = contextRef.current;
    if (!context) return;

    setCurrentStroke(prev => [...prev, point]);
    
    context.lineTo(point.x, point.y);
    context.stroke();
  }, [isDrawing, getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const command: Omit<DrawingCommand, 'userId' | 'timestamp'> = {
        id: `stroke_${Date.now()}_${Math.random()}`,
        type: 'stroke',
        data: {
          points: currentStroke,
          color: tool.color,
          strokeWidth: tool.strokeWidth,
        },
      };

      onDrawingCommand(command);
    }

    setCurrentStroke([]);
  }, [isDrawing, currentStroke, tool, onDrawingCommand]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    onCursorMove(point);

    if (isDrawing) {
      draw(e);
    }
  }, [getCanvasPoint, onCursorMove, isDrawing, draw]);

  const handleMouseLeave = useCallback(() => {
    onCursorMove(null);
    if (isDrawing) {
      stopDrawing();
    }
  }, [onCursorMove, isDrawing, stopDrawing]);

  // Touch events for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    startDrawing(mouseEvent as any);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    handleMouseMove(mouseEvent as any);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 bg-white cursor-crosshair touch-none"
      onMouseDown={startDrawing}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrawing}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

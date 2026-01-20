import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Eraser, Pencil, Trash2, Send, Undo, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DrawingCanvasProps {
  onSubmit: (imageData: string, description?: string) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export function DrawingCanvas({ 
  onSubmit, 
  width = 600, 
  height = 300,
  disabled = false 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [brushSize, setBrushSize] = useState(3);
  const [penColor, setPenColor] = useState("#1a1a2e");
  
  const colors = ["#1a1a2e", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    
    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [point],
      color: tool === "eraser" ? "#ffffff" : penColor,
      width: tool === "eraser" ? brushSize * 3 : brushSize
    };
    setCurrentStroke(newStroke);
  }, [disabled, getCanvasPoint, tool, penColor, brushSize]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point || !currentStroke) return;
    
    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, point]
      };
    });
  }, [isDrawing, disabled, getCanvasPoint, currentStroke]);

  const stopDrawing = useCallback(() => {
    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  }, [currentStroke]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
    
    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    
    const imageData = canvas.toDataURL("image/png");
    onSubmit(imageData);
    clearCanvas();
  };

  const hasContent = strokes.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("pen")}
            disabled={disabled}
            data-testid="button-pen-tool"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("eraser")}
            disabled={disabled}
            data-testid="button-eraser-tool"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-1 ml-2">
            {colors.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  penColor === color ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setPenColor(color)}
                disabled={disabled}
                data-testid={`button-color-${color}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={([val]) => setBrushSize(val)}
            min={1}
            max={10}
            step={1}
            className="w-20"
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="relative border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none cursor-crosshair"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          data-testid="canvas-drawing"
        />
        
        {!hasContent && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/50 text-sm">
              Write or draw your work here...
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={disabled || !hasContent}
            data-testid="button-undo"
          >
            <Undo className="w-4 h-4 mr-1" /> Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            disabled={disabled || !hasContent}
            data-testid="button-clear-canvas"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
        
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={disabled}
                className="gap-2"
                data-testid="button-submit-drawing"
              >
                <Send className="w-4 h-4" /> Submit Work
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

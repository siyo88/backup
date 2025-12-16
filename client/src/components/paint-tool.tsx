import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  Undo2, 
  Plus, 
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  X
} from "lucide-react";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
}

interface PaintToolProps {
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

const CANVAS_SIZE = 500;
const DEFAULT_COLORS = [
  "#000000", "#FFFFFF", "#FF6B9D", "#00C2FF", "#FFD93D",
  "#6BCB77", "#9B59B6", "#FF6B6B", "#4ECDC4", "#FF8C42",
  "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA",
];

type Tool = "brush" | "eraser" | "bucket";

export default function PaintTool({ onSave, onClose }: PaintToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const initialLayer = createNewLayer("Layer 1");
    setLayers([initialLayer]);
    setActiveLayerId(initialLayer.id);
    saveToHistory([initialLayer]);
  }, []);

  const createNewLayer = (name: string): Layer => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
    return {
      id: crypto.randomUUID(),
      name,
      visible: true,
      canvas,
    };
  };

  const saveToHistory = useCallback((layersState: Layer[]) => {
    const snapshots = layersState.map((layer) => {
      const ctx = layer.canvas.getContext("2d");
      return ctx?.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }).filter(Boolean) as ImageData[];

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(snapshots);
      return newHistory.slice(-50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshots = history[newIndex];
      setLayers((prev) => {
        return prev.map((layer, i) => {
          if (snapshots[i]) {
            const ctx = layer.canvas.getContext("2d");
            ctx?.putImageData(snapshots[i], 0, 0);
          }
          return layer;
        });
      });
      setHistoryIndex(newIndex);
      renderCanvas();
    }
  }, [history, historyIndex]);

  const renderCanvas = useCallback(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    const ctx = mainCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    layers.forEach((layer) => {
      if (layer.visible) {
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });
  }, [layers]);

  useEffect(() => {
    renderCanvas();
  }, [layers, renderCanvas]);

  const getActiveLayer = (): Layer | undefined => {
    return layers.find((l) => l.id === activeLayerId);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getPressure = (e: React.PointerEvent): number => {
    return e.pressure > 0 ? e.pressure : 0.5;
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    pressure: number = 0.5
  ) => {
    const adjustedSize = brushSize * (0.5 + pressure * 0.5);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = adjustedSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  };

  const floodFill = (startX: number, startY: number) => {
    const layer = getActiveLayer();
    if (!layer) return;

    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;

    const startPos = (Math.floor(startY) * CANVAS_SIZE + Math.floor(startX)) * 4;
    const targetR = data[startPos];
    const targetG = data[startPos + 1];
    const targetB = data[startPos + 2];
    const targetA = data[startPos + 3];

    const fillColor = hexToRgb(color);
    if (!fillColor) return;

    if (
      targetR === fillColor.r &&
      targetG === fillColor.g &&
      targetB === fillColor.b &&
      targetA === 255
    ) {
      return;
    }

    const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;

      const pos = (y * CANVAS_SIZE + x) * 4;
      if (
        data[pos] !== targetR ||
        data[pos + 1] !== targetG ||
        data[pos + 2] !== targetB ||
        data[pos + 3] !== targetA
      ) {
        continue;
      }

      visited.add(key);
      data[pos] = fillColor.r;
      data[pos + 1] = fillColor.g;
      data[pos + 2] = fillColor.b;
      data[pos + 3] = 255;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
    renderCanvas();
    saveToHistory(layers);
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e);

    if (tool === "bucket") {
      floodFill(coords.x, coords.y);
      return;
    }

    setIsDrawing(true);
    lastPosRef.current = coords;

    const layer = getActiveLayer();
    if (!layer) return;

    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;

    const pressure = getPressure(e);
    drawLine(ctx, coords, coords, pressure);
    renderCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (!isDrawing || !lastPosRef.current) return;

    const layer = getActiveLayer();
    if (!layer) return;

    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;

    const pressure = getPressure(e);
    drawLine(ctx, lastPosRef.current, coords, pressure);
    lastPosRef.current = coords;
    renderCanvas();
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPosRef.current = null;
      saveToHistory(layers);
    }
  };

  const addLayer = () => {
    const newLayer = createNewLayer(`Layer ${layers.length + 1}`);
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers((prev) => {
      const filtered = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) {
        setActiveLayerId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (direction === "up" && index < prev.length - 1) {
        const newLayers = [...prev];
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
        return newLayers;
      }
      if (direction === "down" && index > 0) {
        const newLayers = [...prev];
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
        return newLayers;
      }
      return prev;
    });
  };

  const handleSave = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    mainCanvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, "image/png");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        setTool("brush");
      } else if (e.key === "e" || e.key === "E") {
        setTool("eraser");
      } else if (e.key === "g" || e.key === "G") {
        setTool("bucket");
      } else if (e.key === "[") {
        setBrushSize((prev) => Math.max(1, prev - 5));
      } else if (e.key === "]") {
        setBrushSize((prev) => Math.min(100, prev + 5));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  return (
    <div className="flex h-full bg-background" ref={containerRef}>
      <div className="w-16 bg-card border-r border-border p-2 flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={tool === "brush" ? "default" : "ghost"}
              onClick={() => setTool("brush")}
              className={tool === "brush" ? "bg-theme-pink" : ""}
              data-testid="button-tool-brush"
            >
              <Paintbrush className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Brush (B)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={tool === "eraser" ? "default" : "ghost"}
              onClick={() => setTool("eraser")}
              className={tool === "eraser" ? "bg-theme-blue" : ""}
              data-testid="button-tool-eraser"
            >
              <Eraser className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Eraser (E)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={tool === "bucket" ? "default" : "ghost"}
              onClick={() => setTool("bucket")}
              className={tool === "bucket" ? "bg-theme-yellow text-black" : ""}
              data-testid="button-tool-bucket"
            >
              <PaintBucket className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Paint Bucket (G)</TooltipContent>
        </Tooltip>

        <div className="border-t border-border my-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={undo}
              disabled={historyIndex <= 0}
              data-testid="button-undo"
            >
              <Undo2 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <div className="border-t border-border my-2" />

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center mb-2">Size</p>
          <div 
            className="w-8 h-8 mx-auto rounded-full border-2 border-foreground flex items-center justify-center"
            style={{ 
              width: `${Math.max(8, brushSize / 100 * 32)}px`,
              height: `${Math.max(8, brushSize / 100 * 32)}px`,
              backgroundColor: tool === "eraser" ? "transparent" : color,
            }}
          />
          <p className="text-xs text-center text-muted-foreground mt-1">{brushSize}px</p>
        </div>

        <div className="flex-1" />

        <div className="grid grid-cols-3 gap-1">
          {DEFAULT_COLORS.slice(0, 9).map((c) => (
            <button
              key={c}
              className={`w-4 h-4 rounded-sm border ${color === c ? "ring-2 ring-theme-pink" : "border-border"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              data-testid={`button-color-${c.replace("#", "")}`}
            />
          ))}
        </div>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-8 cursor-pointer rounded border-0"
          data-testid="input-color-picker"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="bg-white rounded-lg shadow-lg touch-none"
            style={{ 
              maxWidth: "100%", 
              maxHeight: "calc(90vh - 100px)",
              cursor: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => {
              handlePointerUp();
              setShowCursor(false);
            }}
            onPointerEnter={() => setShowCursor(true)}
            data-testid="canvas-paint"
          />
        </div>
      </div>

      <div className="w-48 bg-card border-l border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground">Layers</h3>
          <Button size="icon" variant="ghost" onClick={addLayer} data-testid="button-add-layer">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                className={`p-2 rounded-md flex items-center gap-2 cursor-pointer ${
                  activeLayerId === layer.id ? "bg-theme-pink/20" : "hover-elevate"
                }`}
                onClick={() => setActiveLayerId(layer.id)}
                data-testid={`layer-${layer.id}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid={`button-toggle-layer-${layer.id}`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <span className="flex-1 text-sm text-foreground truncate">{layer.name}</span>

                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "up");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid={`button-layer-up-${layer.id}`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "down");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid={`button-layer-down-${layer.id}`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`button-delete-layer-${layer.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Brush Size: {brushSize}px</label>
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => setBrushSize(v)}
              min={1}
              max={100}
              step={1}
              data-testid="slider-brush-size"
            />
            <p className="text-xs text-muted-foreground">[ / ] to adjust</p>
          </div>
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            data-testid="button-cancel-paint"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="flex-1 bg-theme-pink"
            onClick={handleSave}
            data-testid="button-save-paint"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {showCursor && tool !== "bucket" && (
        <div
          className="fixed pointer-events-none rounded-full border-2 border-foreground/50"
          style={{
            width: `${brushSize}px`,
            height: `${brushSize}px`,
            left: cursorPos.x - brushSize / 2,
            top: cursorPos.y - brushSize / 2,
            backgroundColor: tool === "eraser" ? "transparent" : `${color}40`,
          }}
        />
      )}
    </div>
  );
}

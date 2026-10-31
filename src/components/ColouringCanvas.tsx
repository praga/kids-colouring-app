import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  ToolType,
  Stroke,
  FloodFillAction,
  DrawingAction,
  Point,
  BRUSH_SIZES,
  BrushSize
} from '../types/colouring';
import {
  extractPointsFromPointerEvent,
  filterLiftOffHooklet,
  shouldRejectPointer
} from '../utils/palmRejection';
import {
  drawStroke,
  executeFloodFill
} from '../utils/canvasDraw';
import { sound } from '../utils/audioEngine';

export interface ColouringCanvasRef {
  exportCombinedImage: () => string | null;
  generateThumbnail: () => string | null;
}

interface ColouringCanvasProps {
  pageId: string;
  imageSrc: string;
  actions: DrawingAction[];
  onActionsChange: (actions: DrawingAction[]) => void;
  tool: ToolType;
  color: string;
  brushSize: BrushSize;
  palmRejection: boolean;
  onStylusDetected?: (isStylus: boolean) => void;
}

export const ColouringCanvas = forwardRef<ColouringCanvasRef, ColouringCanvasProps>(
  (
    {
      pageId,
      imageSrc,
      actions,
      onActionsChange,
      tool,
      color,
      brushSize,
      palmRejection,
      onStylusDetected
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lineArtCanvasRef = useRef<HTMLCanvasElement>(null);
    const coloringCanvasRef = useRef<HTMLCanvasElement>(null);
    const activeCanvasRef = useRef<HTMLCanvasElement>(null);

    const isDrawingRef = useRef<boolean>(false);
    const currentPointsRef = useRef<Point[]>([]);
    const currentStrokeIdRef = useRef<string>('');
    const sessionStartTimeRef = useRef<number>(Date.now());

    // Native canvas internal coordinate space (800 x 1000)
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 1000;

    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    });

    // Redraw the entire persistent coloring canvas from actions history
    const redrawColoringCanvas = useCallback(() => {
      const canvas = coloringCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Replay all actions (strokes & fills)
      for (const action of actions) {
        if (action.type === 'stroke') {
          drawStroke(ctx, action, 1);
        } else if (action.type === 'bucket') {
          const lineArtCanvas = lineArtCanvasRef.current;
          if (lineArtCanvas) {
            const lineCtx = lineArtCanvas.getContext('2d', { willReadFrequently: true });
            if (lineCtx) {
              executeFloodFill(
                ctx,
                lineCtx,
                action.x,
                action.y,
                action.color,
                CANVAS_WIDTH,
                CANVAS_HEIGHT
              );
            }
          }
        }
      }
    }, [actions]);

    // Load line art image and extract clean transparent black line art
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      img.onload = () => {
        const lineCanvas = lineArtCanvasRef.current;
        if (!lineCanvas) return;
        const ctx = lineCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        lineCanvas.width = CANVAS_WIDTH;
        lineCanvas.height = CANVAS_HEIGHT;

        // Draw source image
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Convert white paper background into 100% transparency
        // This ensures the black outlines are on TOP and coloring is underneath
        const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 10) {
            // Already transparent
            data[i + 3] = 0;
            continue;
          }

          // Perceived lightness (0 = black, 255 = pure white)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum > 225) {
            // White background becomes transparent
            data[i + 3] = 0;
          } else if (lum < 90) {
            // Crisp dark outline stays solid black
            data[i] = 25;
            data[i + 1] = 25;
            data[i + 2] = 25;
            data[i + 3] = 255;
          } else {
            // Anti-aliased boundary edge
            const alpha = Math.round(((225 - lum) / 135) * 255);
            data[i] = 25;
            data[i + 1] = 25;
            data[i + 2] = 25;
            data[i + 3] = Math.max(0, Math.min(255, alpha));
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Once line art is ready, redraw coloring canvas
        redrawColoringCanvas();
      };
    }, [imageSrc, redrawColoringCanvas]);

    // Redraw whenever actions change
    useEffect(() => {
      redrawColoringCanvas();
    }, [actions, redrawColoringCanvas]);

    // Track resize
    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setDimensions({ width: rect.width, height: rect.height });
          }
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Initialize 1:1 internal canvas sizes
    useEffect(() => {
      [coloringCanvasRef.current, activeCanvasRef.current].forEach((canvas) => {
        if (canvas) {
          canvas.width = CANVAS_WIDTH;
          canvas.height = CANVAS_HEIGHT;
        }
      });
      redrawColoringCanvas();
    }, [redrawColoringCanvas]);

    // Convert screen coordinates to canvas logical coordinate space (800x1000)
    const extractLogicalPoints = (e: React.PointerEvent<HTMLCanvasElement>): Point[] => {
      const rawPoints = extractPointsFromPointerEvent(e, sessionStartTimeRef.current);
      const canvas = activeCanvasRef.current;
      if (!canvas) return rawPoints;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / Math.max(rect.width, 1);
      const scaleY = CANVAS_HEIGHT / Math.max(rect.height, 1);

      return rawPoints.map((pt) => ({
        ...pt,
        x: Math.max(0, Math.min(CANVAS_WIDTH, pt.x * scaleX)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT, pt.y * scaleY))
      }));
    };

    // Pointer Event Handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Hardware Stylus detection
      if (e.pointerType === 'pen' && onStylusDetected) {
        onStylusDetected(true);
      }

      // Palm Rejection: discard touch events when palm rejection is active
      if (shouldRejectPointer(e.pointerType, palmRejection)) {
        return;
      }

      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }

      const points = extractLogicalPoints(e);
      if (points.length === 0) return;
      const initialPoint = points[0];

      // Paint Bucket Tool: Flood Fill
      if (tool === 'bucket') {
        const coloringCanvas = coloringCanvasRef.current;
        const lineCanvas = lineArtCanvasRef.current;
        if (!coloringCanvas || !lineCanvas) return;

        const coloringCtx = coloringCanvas.getContext('2d', { willReadFrequently: true });
        const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });
        if (!coloringCtx || !lineCtx) return;

        sound.playSplash();

        const success = executeFloodFill(
          coloringCtx,
          lineCtx,
          initialPoint.x,
          initialPoint.y,
          color,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );

        if (success) {
          const fillAction: FloodFillAction = {
            id: 'fill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            type: 'bucket',
            x: initialPoint.x,
            y: initialPoint.y,
            color,
            pageId,
            timestamp: Date.now()
          };
          onActionsChange([...actions, fillAction]);
        }
        return;
      }

      // Freehand Tools: Crayon, Brush, Marker, Sparkle, Eraser
      isDrawingRef.current = true;
      currentPointsRef.current = [...points];
      currentStrokeIdRef.current =
        'stroke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

      // Draw immediate initial dot on active preview canvas
      const activeCanvas = activeCanvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          const numericSize = BRUSH_SIZES[brushSize].size;
          drawStroke(
            ctx,
            {
              id: currentStrokeIdRef.current,
              type: 'stroke',
              tool,
              color,
              size: numericSize,
              points: [initialPoint],
              pageId,
              timestamp: Date.now()
            },
            1
          );
        }
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      if (shouldRejectPointer(e.pointerType, palmRejection)) return;

      e.preventDefault();
      const newPoints = extractLogicalPoints(e);
      if (newPoints.length === 0) return;

      currentPointsRef.current.push(...newPoints);

      // Sparkle sound
      if (tool === 'sparkle' && currentPointsRef.current.length % 16 === 0) {
        sound.playSparkle();
      }

      // Render updated stroke on active preview canvas
      const activeCanvas = activeCanvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          const numericSize = BRUSH_SIZES[brushSize].size;
          drawStroke(
            ctx,
            {
              id: currentStrokeIdRef.current,
              type: 'stroke',
              tool,
              color,
              size: numericSize,
              points: currentPointsRef.current,
              pageId,
              timestamp: Date.now()
            },
            1
          );
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }

      // Clean active scratchpad
      const activeCanvas = activeCanvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
      }

      const rawPoints = currentPointsRef.current;
      if (rawPoints.length === 0) return;

      // Filter out lift-off hooklet
      const cleanedPoints = filterLiftOffHooklet(rawPoints);
      const numericSize = BRUSH_SIZES[brushSize].size;

      const newStroke: Stroke = {
        id: currentStrokeIdRef.current,
        type: 'stroke',
        tool,
        color,
        size: numericSize,
        points: cleanedPoints,
        pageId,
        timestamp: Date.now()
      };

      // Append new stroke to history
      onActionsChange([...actions, newStroke]);
      currentPointsRef.current = [];
    };

    // Imperative ref methods for high-res image export & thumbnail generation
    useImperativeHandle(ref, () => ({
      exportCombinedImage: () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = CANVAS_WIDTH * 2;
        offscreen.height = CANVAS_HEIGHT * 2;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;

        // 1. Draw solid white background paper
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        // 2. Draw child coloring layer
        const coloringCanvas = coloringCanvasRef.current;
        if (coloringCanvas) {
          ctx.drawImage(coloringCanvas, 0, 0, offscreen.width, offscreen.height);
        }

        // 3. Draw black line art layer on top (lines always stay on top!)
        const lineCanvas = lineArtCanvasRef.current;
        if (lineCanvas) {
          ctx.drawImage(lineCanvas, 0, 0, offscreen.width, offscreen.height);
        }

        return offscreen.toDataURL('image/png');
      },

      generateThumbnail: () => {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 240;
        thumbCanvas.height = 300;
        const ctx = thumbCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);

        const coloringCanvas = coloringCanvasRef.current;
        if (coloringCanvas) {
          ctx.drawImage(coloringCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }

        const lineCanvas = lineArtCanvasRef.current;
        if (lineCanvas) {
          ctx.drawImage(lineCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }

        return thumbCanvas.toDataURL('image/webp', 0.85);
      }
    }));

    const isLandscape = dimensions.width / Math.max(dimensions.height, 1) >= (CANVAS_WIDTH / CANVAS_HEIGHT);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 select-none touch-none overflow-hidden"
      >
        {/* Canvas Easel Container with 800x1000 aspect ratio */}
        <div
          className="relative bg-white rounded-3xl shadow-2xl border-4 border-kid-yellow/60 overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            height: isLandscape ? '100%' : 'auto',
            width: isLandscape ? 'auto' : '100%',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* Layer 1: Child Coloring Canvas (Strokes + Bucket Fills) - Bottom */}
          <canvas
            ref={coloringCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Layer 2: Active Scratchpad Canvas (Real-time in-progress stroke) - Middle */}
          <canvas
            ref={activeCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-[10]"
            style={{
              width: '100%',
              height: '100%'
            }}
          />

          {/* Layer 3: Line Art Canvas (Black Outlines with Transparent Background) - TOP! */}
          {/* Outlines sit physically on top with pointer-events-none so lines are never covered! */}
          <canvas
            ref={lineArtCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full pointer-events-none z-[20]"
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </div>
    );
  }
);

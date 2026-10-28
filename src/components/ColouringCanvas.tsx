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
    const lineArtImageRef = useRef<HTMLImageElement | null>(null);
    const sessionStartTimeRef = useRef<number>(Date.now());

    // Native logical canvas dimensions (matches line art aspect ratio 800 x 1000)
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

      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Replay all actions (strokes & fills)
      for (const action of actions) {
        if (action.type === 'stroke') {
          drawStroke(ctx, action, 1);
        } else if (action.type === 'bucket') {
          const lineArtCanvas = lineArtCanvasRef.current;
          if (lineArtCanvas) {
            const lineCtx = lineArtCanvas.getContext('2d');
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

      ctx.restore();
    }, [actions]);

    // Load and render line art image onto lineArtCanvas
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      img.onload = () => {
        lineArtImageRef.current = img;
        const lineCanvas = lineArtCanvasRef.current;
        if (!lineCanvas) return;
        const ctx = lineCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        lineCanvas.width = CANVAS_WIDTH * dpr;
        lineCanvas.height = CANVAS_HEIGHT * dpr;

        ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        redrawColoringCanvas();
      };
    }, [imageSrc, redrawColoringCanvas]);

    // Redraw whenever actions change
    useEffect(() => {
      redrawColoringCanvas();
    }, [actions, redrawColoringCanvas]);

    // Handle HiDPI scaling & resize tracking
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

    // Set canvas internal resolution to high DPI matching tablet screen
    useEffect(() => {
      const dpr = window.devicePixelRatio || 1;

      [coloringCanvasRef.current, activeCanvasRef.current].forEach((canvas) => {
        if (canvas) {
          canvas.width = CANVAS_WIDTH * dpr;
          canvas.height = CANVAS_HEIGHT * dpr;
        }
      });

      redrawColoringCanvas();
    }, [redrawColoringCanvas]);

    // Convert screen coordinates to canvas logical coordinate space (800x1000)
    const getLogicalCoordinates = (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = activeCanvasRef.current;
      if (!canvas) return { x: screenX, y: screenY };

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      return {
        x: (screenX - rect.left) * scaleX,
        y: (screenY - rect.top) * scaleY
      };
    };

    // Extract points and map to logical coordinates
    const extractLogicalPoints = (e: React.PointerEvent<HTMLCanvasElement>): Point[] => {
      const rawPoints = extractPointsFromPointerEvent(e, sessionStartTimeRef.current);
      const canvas = activeCanvasRef.current;
      if (!canvas) return rawPoints;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      return rawPoints.map((pt) => ({
        ...pt,
        x: pt.x * scaleX,
        y: pt.y * scaleY
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
        // Pointer capture fallback
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
          const dpr = window.devicePixelRatio || 1;
          ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
          ctx.save();
          ctx.scale(dpr, dpr);

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

          ctx.restore();
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

      // Play soft sparkle sound periodically when drawing with magic brush
      if (tool === 'sparkle' && currentPointsRef.current.length % 16 === 0) {
        sound.playSparkle();
      }

      // Render updated stroke on active preview canvas
      const activeCanvas = activeCanvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
          ctx.save();
          ctx.scale(dpr, dpr);

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

          ctx.restore();
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Release fallback
      }

      // Clean active scratchpad
      const activeCanvas = activeCanvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
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

        // 1. Draw solid white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        // 2. Draw child coloring layer
        const coloringCanvas = coloringCanvasRef.current;
        if (coloringCanvas) {
          ctx.drawImage(coloringCanvas, 0, 0, offscreen.width, offscreen.height);
        }

        // 3. Draw line art layer on top with multiply blend mode
        const lineCanvas = lineArtCanvasRef.current;
        if (lineCanvas) {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(lineCanvas, 0, 0, offscreen.width, offscreen.height);
          ctx.restore();
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
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(lineCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
          ctx.restore();
        }

        return thumbCanvas.toDataURL('image/webp', 0.8);
      }
    }));

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 select-none touch-none overflow-hidden"
      >
        {/* Canvas Easel Container with 800x1000 aspect ratio */}
        <div
          className="relative bg-white rounded-3xl shadow-2xl border-4 border-kid-yellow/60 overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: '800 / 1000',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {/* Layer 1: Child Coloring Canvas (Strokes + Bucket Fills) */}
          <canvas
            ref={coloringCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Layer 2: Line Art Image Canvas with Multiply blend mode (Outlines stay on top!) */}
          <canvas
            ref={lineArtCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              mixBlendMode: 'multiply'
            }}
          />

          {/* Layer 3: Active Scratchpad Canvas (Real-time in-progress stroke) */}
          <canvas
            ref={activeCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
            style={{
              width: '100%',
              height: '100%',
              mixBlendMode: tool === 'eraser' ? 'normal' : 'multiply'
            }}
          />
        </div>
      </div>
    );
  }
);

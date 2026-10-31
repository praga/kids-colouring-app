import { Stroke, Point, FloodFillAction, DrawingAction } from '../types/colouring';

/**
 * Maps raw pressure (0.0 - 1.0 from 4096-level Lenovo Xiaoxin Stylus)
 * to an ergonomic dynamic scale suitable for a 5-year-old child.
 */
export function calculatePressureFactor(pressure: number, tool: string): { widthFactor: number; alphaFactor: number } {
  const p = Math.max(0.08, Math.min(1.0, pressure));

  switch (tool) {
    case 'crayon': {
      const widthFactor = 0.55 + 0.85 * Math.pow(p, 0.85);
      const alphaFactor = Math.min(1.0, 0.45 + 0.55 * p);
      return { widthFactor, alphaFactor };
    }
    case 'brush': {
      const widthFactor = 0.35 + 1.25 * Math.pow(p, 0.9);
      const alphaFactor = Math.min(1.0, 0.65 + 0.35 * p);
      return { widthFactor, alphaFactor };
    }
    case 'marker': {
      const widthFactor = 0.75 + 0.45 * p;
      const alphaFactor = 0.92;
      return { widthFactor, alphaFactor };
    }
    case 'sparkle': {
      const widthFactor = 0.6 + 0.8 * p;
      const alphaFactor = 0.95;
      return { widthFactor, alphaFactor };
    }
    case 'eraser': {
      const widthFactor = 0.8 + 0.4 * p;
      return { widthFactor, alphaFactor: 1.0 };
    }
    default:
      return { widthFactor: 1.0, alphaFactor: 1.0 };
  }
}

/**
 * Draws a 5-point sparkling star at (cx, cy)
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = '#FFE066';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a single stroke onto the 2D canvas context with smoothing and tool-specific aesthetics.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number = 1
) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const tool = stroke.tool;
  const baseSize = (stroke.size || 16) * scale;
  const color = stroke.color || '#E63946';

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = baseSize * 1.5;
  } else if (tool === 'marker') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.lineWidth = baseSize;
  } else if (tool === 'brush') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = baseSize;
  } else if (tool === 'sparkle') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, baseSize * 0.35);
  } else {
    // Default: Crayon
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = baseSize;
  }

  // Handle single dot / tap
  if (points.length === 1) {
    const pt = points[0];
    const { widthFactor, alphaFactor } = calculatePressureFactor(pt.p, tool);

    if (tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(pt.x * scale, pt.y * scale, (baseSize * 1.5 * widthFactor) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'sparkle') {
      drawStar(ctx, pt.x * scale, pt.y * scale, 5, baseSize * 0.8 * widthFactor, baseSize * 0.35 * widthFactor, color);
    } else {
      ctx.globalAlpha = alphaFactor;
      ctx.beginPath();
      ctx.arc(pt.x * scale, pt.y * scale, (baseSize * widthFactor) / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Multi-point stroke rendering
  if (tool === 'sparkle') {
    ctx.beginPath();
    ctx.moveTo(points[0].x * scale, points[0].y * scale);
    for (let i = 1; i < points.length - 1; i++) {
      const xc = ((points[i].x + points[i + 1].x) / 2) * scale;
      const yc = ((points[i].y + points[i + 1].y) / 2) * scale;
      ctx.quadraticCurveTo(points[i].x * scale, points[i].y * scale, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x * scale, points[points.length - 1].y * scale);
    ctx.stroke();

    // Place stars along points with spacing
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (i === 0 || i === points.length - 1 || i % 4 === 0) {
        const starSize = Math.max(7, baseSize * 0.75 * (0.6 + 0.6 * pt.p));
        const starColors = ['#FFE066', '#FF6B8B', '#00BBF9', '#70E000', color];
        const starColor = starColors[i % starColors.length];
        drawStar(ctx, pt.x * scale, pt.y * scale, 5, starSize, starSize * 0.4, starColor);
      }
    }
    ctx.restore();
    return;
  }

  // Continuous stroke using quadratic curve interpolation with dynamic pressure segments
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const pAvg = (p0.p + p1.p) / 2;
    const { widthFactor, alphaFactor } = calculatePressureFactor(pAvg, tool);

    ctx.lineWidth = baseSize * widthFactor;
    if (tool !== 'eraser') {
      ctx.globalAlpha = alphaFactor;
    }

    ctx.beginPath();
    ctx.moveTo(p0.x * scale, p0.y * scale);
    const midX = ((p0.x + p1.x) / 2) * scale;
    const midY = ((p0.y + p1.y) / 2) * scale;
    ctx.quadraticCurveTo(p0.x * scale, p0.y * scale, midX, midY);
    ctx.lineTo(p1.x * scale, p1.y * scale);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * High-performance Flood Fill (Paint Bucket) implementation.
 * Samples the line art canvas (where black lines have alpha > 100) and coloring canvas.
 * Fills cleanly inside bounded contours in under 15ms using Int32Array queue.
 */
export function executeFloodFill(
  coloringCtx: CanvasRenderingContext2D,
  lineArtCtx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number,
  tolerance: number = 35
): boolean {
  const fillRgb = hexToRgb(fillColorHex);
  if (!fillRgb) return false;

  const x = Math.floor(startX);
  const y = Math.floor(startY);

  if (x < 0 || x >= width || y < 0 || y >= height) return false;

  const lineArtData = lineArtCtx.getImageData(0, 0, width, height);
  const coloringData = coloringCtx.getImageData(0, 0, width, height);

  const lData = lineArtData.data;
  const cData = coloringData.data;

  const startIdx = (y * width + x) * 4;

  // If clicked directly on a line art boundary (alpha > 110), do not fill over the outline
  if (lData[startIdx + 3] > 110) {
    return false;
  }

  const targetR = cData[startIdx];
  const targetG = cData[startIdx + 1];
  const targetB = cData[startIdx + 2];
  const targetA = cData[startIdx + 3];

  // Already the same color
  if (
    Math.abs(targetR - fillRgb.r) < 5 &&
    Math.abs(targetG - fillRgb.g) < 5 &&
    Math.abs(targetB - fillRgb.b) < 5 &&
    targetA > 220
  ) {
    return false;
  }

  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels * 2);
  let qHead = 0;
  let qTail = 0;

  queue[qTail++] = x;
  queue[qTail++] = y;
  visited[y * width + x] = 1;

  function isMatch(idx: number): boolean {
    // Stop if hit line art outline
    if (lData[idx + 3] > 110) {
      return false;
    }

    // Match starting pixel color in coloring layer
    const r = cData[idx];
    const g = cData[idx + 1];
    const b = cData[idx + 2];
    const a = cData[idx + 3];

    return (
      Math.abs(r - targetR) <= tolerance &&
      Math.abs(g - targetG) <= tolerance &&
      Math.abs(b - targetB) <= tolerance &&
      Math.abs(a - targetA) <= tolerance
    );
  }

  while (qHead < qTail) {
    const curX = queue[qHead++];
    const curY = queue[qHead++];
    const idx = (curY * width + curX) * 4;

    cData[idx] = fillRgb.r;
    cData[idx + 1] = fillRgb.g;
    cData[idx + 2] = fillRgb.b;
    cData[idx + 3] = 255;

    // 4-way neighbors
    const nCoords = [
      curX + 1, curY,
      curX - 1, curY,
      curX, curY + 1,
      curX, curY - 1
    ];

    for (let i = 0; i < 8; i += 2) {
      const nx = nCoords[i];
      const ny = nCoords[i + 1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!visited[nPos]) {
          visited[nPos] = 1;
          if (isMatch(nPos * 4)) {
            queue[qTail++] = nx;
            queue[qTail++] = ny;
          }
        }
      }
    }
  }

  coloringCtx.putImageData(coloringData, 0, 0);
  return true;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

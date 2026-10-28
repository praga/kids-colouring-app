import { Stroke, Point, FloodFillAction, DrawingAction } from '../types/colouring';

/**
 * Maps raw pressure (0.0 - 1.0 from 4096-level Lenovo Xiaoxin Stylus)
 * to an ergonomic dynamic scale suitable for a 5-year-old child.
 * Children often hold the stylus with varying lighter or firmer grips.
 */
export function calculatePressureFactor(pressure: number, tool: string): { widthFactor: number; alphaFactor: number } {
  // Clamp pressure
  const p = Math.max(0.05, Math.min(1.0, pressure));

  switch (tool) {
    case 'crayon': {
      // Crayon gets significantly thicker and more opaque with firm pressure
      // Soft touch = 0.55 width, 0.45 opacity (light sketch)
      // Firm press = 1.45 width, 0.95 opacity (deep wax color)
      const widthFactor = 0.5 + 0.9 * Math.pow(p, 0.85);
      const alphaFactor = Math.min(1.0, 0.35 + 0.65 * p);
      return { widthFactor, alphaFactor };
    }
    case 'brush': {
      // Paintbrush has high dynamic width response for expressive strokes
      const widthFactor = 0.35 + 1.25 * Math.pow(p, 0.9);
      const alphaFactor = Math.min(1.0, 0.6 + 0.4 * p);
      return { widthFactor, alphaFactor };
    }
    case 'marker': {
      // Marker has moderate width variation but stays vibrant
      const widthFactor = 0.75 + 0.45 * p;
      const alphaFactor = 0.88;
      return { widthFactor, alphaFactor };
    }
    case 'sparkle': {
      const widthFactor = 0.6 + 0.8 * p;
      const alphaFactor = 0.95;
      return { widthFactor, alphaFactor };
    }
    case 'eraser': {
      // Eraser width variation
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
    ctx.globalAlpha = 0.85;
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

  // Handle single dot/tap
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
    // For sparkle pen, draw a gentle glowing line plus magical stars periodically
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
    let lastStarDist = 0;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (i === 0 || i === points.length - 1 || i % 4 === 0) {
        const starSize = Math.max(6, baseSize * 0.7 * (0.6 + 0.6 * pt.p));
        const starColors = ['#FFE066', '#FF6B8B', '#00BBF9', '#70E000', color];
        const starColor = starColors[i % starColors.length];
        drawStar(ctx, pt.x * scale, pt.y * scale, 5, starSize, starSize * 0.4, starColor);
      }
    }
    ctx.restore();
    return;
  }

  // Draw continuous stroke using quadratic curve interpolation with dynamic pressure segments
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
 * Flood Fill (Paint Bucket) implementation.
 * Samples the line art and coloring canvas buffers and fills an enclosed bounded region.
 */
export function executeFloodFill(
  coloringCtx: CanvasRenderingContext2D,
  lineArtCtx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number,
  tolerance: number = 32
): boolean {
  // Parse hex color into RGBA
  const fillRgb = hexToRgb(fillColorHex);
  if (!fillRgb) return false;

  const x = Math.round(startX);
  const y = Math.round(startY);

  if (x < 0 || x >= width || y < 0 || y >= height) return false;

  // Retrieve pixel data from both line art and coloring canvas
  const lineArtData = lineArtCtx.getImageData(0, 0, width, height);
  const coloringData = coloringCtx.getImageData(0, 0, width, height);

  const lData = lineArtData.data;
  const cData = coloringData.data;

  const targetIdx = (y * width + x) * 4;

  // Check if clicked directly on a dark line art outline
  const lineR = lData[targetIdx];
  const lineG = lData[targetIdx + 1];
  const lineB = lData[targetIdx + 2];
  const lineA = lData[targetIdx + 3];

  // If line art pixel is dark/black line, don't fill over the line
  const isDarkLine = lineA > 100 && (lineR + lineG + lineB) / 3 < 120;
  if (isDarkLine) {
    return false;
  }

  // Target color from coloring canvas
  const targetR = cData[targetIdx];
  const targetG = cData[targetIdx + 1];
  const targetB = cData[targetIdx + 2];
  const targetA = cData[targetIdx + 3];

  // If target already equals fill color, nothing to do
  if (
    Math.abs(targetR - fillRgb.r) < 5 &&
    Math.abs(targetG - fillRgb.g) < 5 &&
    Math.abs(targetB - fillRgb.b) < 5 &&
    targetA > 200
  ) {
    return false;
  }

  // Visited array to prevent infinite loops
  const visited = new Uint8Array(width * height);
  const queue: number[] = [x, y];
  visited[y * width + x] = 1;

  function matchesTarget(idx: number): boolean {
    // Check if line art has a black boundary at this pixel
    const lR = lData[idx];
    const lG = lData[idx + 1];
    const lB = lData[idx + 2];
    const lA = lData[idx + 3];
    // Boundary line detection: strong dark line stops the fill
    if (lA > 100 && (lR + lG + lB) / 3 < 110) {
      return false;
    }

    // Color match tolerance with the target starting pixel
    const cR = cData[idx];
    const cG = cData[idx + 1];
    const cB = cData[idx + 2];
    const cA = cData[idx + 3];

    return (
      Math.abs(cR - targetR) <= tolerance &&
      Math.abs(cG - targetG) <= tolerance &&
      Math.abs(cB - targetB) <= tolerance &&
      Math.abs(cA - targetA) <= tolerance
    );
  }

  let head = 0;
  const maxPixels = width * height;

  while (head < queue.length && head < maxPixels * 2) {
    const curX = queue[head++];
    const curY = queue[head++];

    const curIdx = (curY * width + curX) * 4;

    // Apply fill color
    cData[curIdx] = fillRgb.r;
    cData[curIdx + 1] = fillRgb.g;
    cData[curIdx + 2] = fillRgb.b;
    cData[curIdx + 3] = 255;

    // Check 4 neighbors
    const neighbors = [
      [curX + 1, curY],
      [curX - 1, curY],
      [curX, curY + 1],
      [curX, curY - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!visited[nPos]) {
          visited[nPos] = 1;
          const nIdx = nPos * 4;
          if (matchesTarget(nIdx)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Put modified pixel data back onto coloring canvas
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

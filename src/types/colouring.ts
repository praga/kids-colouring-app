export type ToolType = 'crayon' | 'brush' | 'marker' | 'sparkle' | 'bucket' | 'eraser';

export type BrushSize = 'small' | 'medium' | 'big' | 'jumbo';

export interface Point {
  x: number;
  y: number;
  p: number; // Pressure: 0.0 - 1.0 (Lenovo Xiaoxin 4096 levels)
  t: number; // Relative timestamp ms
}

export interface Stroke {
  id: string;
  type: 'stroke';
  tool: ToolType;
  color: string;
  size: number;
  points: Point[];
  pageId: string;
  timestamp: number;
}

export interface FloodFillAction {
  id: string;
  type: 'bucket';
  x: number;
  y: number;
  color: string;
  pageId: string;
  timestamp: number;
}

export type DrawingAction = Stroke | FloodFillAction;

export interface PageMetadata {
  id: string;
  title: string;
  filename: string;
  category: string;
  thumbnail?: string;
  order: number;
  featured?: boolean;
}

export interface PageDrawingState {
  pageId: string;
  actions: DrawingAction[];
  snapshot?: string; // Base64 thumbnail of completed coloring
  completed?: boolean;
  updatedAt: number;
}

export const BRUSH_SIZES: Record<BrushSize, { label: string; size: number; iconSize: number }> = {
  small: { label: 'Small', size: 6, iconSize: 10 },
  medium: { label: 'Medium', size: 14, iconSize: 16 },
  big: { label: 'Big', size: 26, iconSize: 22 },
  jumbo: { label: 'Jumbo', size: 44, iconSize: 30 }
};

export interface PaletteColor {
  name: string;
  hex: string;
  border?: string;
}

export const RAINBOW_PALETTE: PaletteColor[] = [
  { name: 'Cherry Red', hex: '#E63946' },
  { name: 'Bubblegum Pink', hex: '#FF6B8B' },
  { name: 'Pastel Rose', hex: '#FFB3C6' },
  { name: 'Sunset Orange', hex: '#FB8500' },
  { name: 'Peach', hex: '#FFB703' },
  { name: 'Sunshine Yellow', hex: '#FFEE32' },
  { name: 'Lime Green', hex: '#70E000' },
  { name: 'Forest Green', hex: '#38B000' },
  { name: 'Mint Green', hex: '#80ED99' },
  { name: 'Sky Blue', hex: '#00BBF9' },
  { name: 'Ocean Blue', hex: '#0077B6' },
  { name: 'Periwinkle', hex: '#7209B7' },
  { name: 'Purple Star', hex: '#9B5DE5' },
  { name: 'Lavender', hex: '#D8BBFF' },
  { name: 'Teddy Brown', hex: '#7F4F24' },
  { name: 'Charcoal Black', hex: '#212529' },
  { name: 'Pure White', hex: '#FFFFFF', border: '#D1D5DB' },
  { name: 'Gold Sparkle', hex: '#FFD700' }
];

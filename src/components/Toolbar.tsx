import React from 'react';
import {
  ToolType,
  BrushSize,
  BRUSH_SIZES,
  RAINBOW_PALETTE,
  PaletteColor
} from '../types/colouring';
import {
  Paintbrush,
  Sparkles,
  PaintBucket,
  Eraser,
  PenLine,
  Trash2,
  Circle
} from 'lucide-react';
import { sound } from '../utils/audioEngine';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  brushSize: BrushSize;
  onSelectBrushSize: (size: BrushSize) => void;
  onOpenClearModal: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  brushSize,
  onSelectBrushSize,
  onOpenClearModal
}) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'crayon',
      label: 'Crayon',
      icon: <span className="text-2xl sm:text-3xl">🖍️</span>,
      color: 'bg-orange-100 border-orange-400 text-orange-700'
    },
    {
      id: 'brush',
      label: 'Brush',
      icon: <span className="text-2xl sm:text-3xl">🖌️</span>,
      color: 'bg-sky-100 border-sky-400 text-sky-700'
    },
    {
      id: 'marker',
      label: 'Marker',
      icon: <span className="text-2xl sm:text-3xl">🖊️</span>,
      color: 'bg-emerald-100 border-emerald-400 text-emerald-700'
    },
    {
      id: 'sparkle',
      label: 'Magic',
      icon: <span className="text-2xl sm:text-3xl">✨</span>,
      color: 'bg-purple-100 border-purple-400 text-purple-700'
    },
    {
      id: 'bucket',
      label: 'Bucket',
      icon: <span className="text-2xl sm:text-3xl">🪣</span>,
      color: 'bg-rose-100 border-rose-400 text-rose-700'
    },
    {
      id: 'eraser',
      label: 'Eraser',
      icon: <span className="text-2xl sm:text-3xl">🧼</span>,
      color: 'bg-slate-100 border-slate-400 text-slate-700'
    }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border-t-4 border-kid-yellow/40 p-2 sm:p-3 select-none flex flex-col gap-2 sm:gap-2.5 shadow-lg z-30">
      {/* Top Row: Tool selector & Size pills & Clean button */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {tools.map((t) => {
            const isSelected = currentTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  sound.playPop();
                  onSelectTool(t.id);
                }}
                className={`h-13 sm:h-16 px-2.5 sm:px-4 rounded-2xl flex flex-col items-center justify-center font-extrabold transition-all border-3 ${
                  isSelected
                    ? `${t.color} scale-105 shadow-md ring-4 ring-kid-pink/40 -translate-y-1`
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 active:translate-y-0.5'
                }`}
                title={t.label}
              >
                {t.icon}
                <span className="text-[10px] sm:text-xs font-bold mt-0.5">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Brush Size Selector (Hidden when Bucket is selected) */}
        {currentTool !== 'bucket' && (
          <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 p-1.5 rounded-2xl border-2 border-gray-200">
            {(['small', 'medium', 'big', 'jumbo'] as BrushSize[]).map((sizeKey) => {
              const conf = BRUSH_SIZES[sizeKey];
              const isSelected = brushSize === sizeKey;
              return (
                <button
                  key={sizeKey}
                  onClick={() => {
                    sound.playPop();
                    onSelectBrushSize(sizeKey);
                  }}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-kid-pink text-white shadow-bubbly scale-110'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title={`${conf.label} Brush Size`}
                >
                  <div
                    className="rounded-full bg-current transition-all"
                    style={{ width: `${conf.iconSize}px`, height: `${conf.iconSize}px` }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Clear Page Button */}
        <button
          onClick={() => {
            sound.playPop();
            onOpenClearModal();
          }}
          className="h-13 sm:h-16 px-3 sm:px-4 rounded-2xl bg-rose-50 border-3 border-rose-300 text-rose-700 font-bold flex flex-col items-center justify-center hover:bg-rose-100 active:translate-y-0.5 transition-all ml-auto shrink-0"
          title="Start Fresh / Clear"
        >
          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          <span className="text-[10px] sm:text-xs mt-0.5">Clean</span>
        </button>
      </div>

      {/* Bottom Row: Rainbow Color Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
        {RAINBOW_PALETTE.map((c) => {
          const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              onClick={() => {
                sound.playPop();
                onSelectColor(c.hex);
                // If currently on eraser, auto-switch back to previous brush tool (e.g. crayon)
                if (currentTool === 'eraser') {
                  onSelectTool('crayon');
                }
              }}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl shrink-0 transition-all border-3 ${
                isSelected
                  ? 'scale-125 ring-4 ring-kid-purple/50 shadow-md -translate-y-1 z-10'
                  : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundColor: c.hex,
                borderColor: c.border || (isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.15)')
              }}
              title={c.name}
            />
          );
        })}
      </div>
    </div>
  );
};

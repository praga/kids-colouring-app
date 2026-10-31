import React from 'react';
import {
  ToolType,
  BrushSize,
  BRUSH_SIZES,
  RAINBOW_PALETTE,
  PaletteColor
} from '../types/colouring';
import {
  Trash2
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
      icon: <span className="text-xl sm:text-2xl">🖍️</span>,
      color: 'bg-orange-100 border-orange-400 text-orange-700'
    },
    {
      id: 'brush',
      label: 'Brush',
      icon: <span className="text-xl sm:text-2xl">🖌️</span>,
      color: 'bg-sky-100 border-sky-400 text-sky-700'
    },
    {
      id: 'marker',
      label: 'Marker',
      icon: <span className="text-xl sm:text-2xl">🖊️</span>,
      color: 'bg-emerald-100 border-emerald-400 text-emerald-700'
    },
    {
      id: 'sparkle',
      label: 'Magic',
      icon: <span className="text-xl sm:text-2xl">✨</span>,
      color: 'bg-purple-100 border-purple-400 text-purple-700'
    },
    {
      id: 'bucket',
      label: 'Bucket',
      icon: <span className="text-xl sm:text-2xl">🪣</span>,
      color: 'bg-rose-100 border-rose-400 text-rose-700'
    },
    {
      id: 'eraser',
      label: 'Eraser',
      icon: <span className="text-xl sm:text-2xl">🧼</span>,
      color: 'bg-slate-100 border-slate-400 text-slate-700'
    }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border-t-2 border-kid-yellow/40 px-2 sm:px-4 py-2 sm:py-2.5 select-none flex flex-col gap-2 sm:gap-2.5 shadow-lg z-30 shrink-0">
      {/* Top Row: Tool selector & Size pills & Clean button */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto py-1 px-1 no-scrollbar">
        {/* Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {tools.map((t) => {
            const isSelected = currentTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  sound.playPop();
                  onSelectTool(t.id);
                }}
                className={`h-12 sm:h-14 min-w-[50px] sm:min-w-[58px] px-2.5 sm:px-3.5 py-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-extrabold transition-all border-2 shrink-0 ${
                  isSelected
                    ? `${t.color} scale-105 shadow-sm ring-3 ring-kid-pink/40`
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 active:translate-y-0.5'
                }`}
                title={t.label}
              >
                <span className="text-lg sm:text-xl leading-none flex items-center justify-center">{t.icon}</span>
                <span className="text-[10px] sm:text-xs font-black leading-tight mt-1 tracking-tight text-center">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Brush Size Selector (Hidden when Bucket is selected) */}
        {currentTool !== 'bucket' && (
          <div className="h-12 sm:h-14 flex items-center gap-1 sm:gap-1.5 bg-gray-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 shrink-0">
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
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-kid-pink text-white shadow-sm scale-105'
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
          className="h-12 sm:h-14 min-w-[50px] sm:min-w-[58px] px-2.5 sm:px-3.5 py-1 rounded-xl sm:rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-700 font-bold flex flex-col items-center justify-center hover:bg-rose-100 active:translate-y-0.5 transition-all ml-auto shrink-0 shadow-sm"
          title="Start Fresh / Clear"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
          <span className="text-[10px] sm:text-xs font-black leading-tight mt-1 tracking-tight text-center">
            Clean
          </span>
        </button>
      </div>

      {/* Bottom Row: Rainbow Color Chips */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
        {RAINBOW_PALETTE.map((c) => {
          const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
          const isWhite = c.hex.toLowerCase() === '#ffffff';
          return (
            <button
              key={c.hex}
              onClick={() => {
                sound.playPop();
                onSelectColor(c.hex);
                if (currentTool === 'eraser') {
                  onSelectTool('crayon');
                }
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0 transition-all border-2 sm:border-3 ${
                isSelected
                  ? 'scale-110 ring-3 ring-kid-purple/50 shadow-sm z-10'
                  : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundColor: c.hex,
                borderColor: isWhite ? '#94A3B8' : (c.border || (isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.15)'))
              }}
              title={c.name}
            />
          );
        })}
      </div>
    </div>
  );
};

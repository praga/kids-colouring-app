import React from 'react';
import {
  BookOpen,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  Sparkles,
  PenTool,
  Hand
} from 'lucide-react';
import { sound } from '../utils/audioEngine';

interface HeaderProps {
  pageTitle: string;
  pageIndex: number;
  totalPages: number;
  onOpenBookshelf: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  palmRejection: boolean;
  onTogglePalmRejection: () => void;
  isStylusActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExportImage: () => void;
  onCelebrate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  pageIndex,
  totalPages,
  onOpenBookshelf,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  palmRejection,
  onTogglePalmRejection,
  isStylusActive,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onExportImage,
  onCelebrate
}) => {
  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b-2 border-kid-yellow/40 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3 select-none shadow-sm z-30 shrink-0">
      {/* Left: Bookshelf button & Page Info */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
        <button
          onClick={() => {
            sound.playPop();
            onOpenBookshelf();
          }}
          className="h-10 sm:h-11 px-3 sm:px-4 bg-kid-yellow rounded-xl sm:rounded-2xl font-extrabold text-gray-800 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5 transition-all inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm border-2 border-amber-300 shrink-0"
          title="Choose a Colouring Page"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900 shrink-0" />
          <span className="font-extrabold tracking-wide">Pages</span>
        </button>

        <div className="flex flex-col min-w-0 justify-center">
          <h1 className="text-xs sm:text-base lg:text-lg font-black text-gray-800 leading-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-[260px]">
            {pageTitle}
          </h1>
          <span className="text-[10px] sm:text-xs font-bold text-kid-pink whitespace-nowrap mt-0.5 leading-none">
            {pageIndex + 1} / {totalPages}
          </span>
        </div>
      </div>

      {/* Center: Stylus & Palm Rejection Mode Pill */}
      <div className="flex items-center shrink-0">
        <button
          onClick={() => {
            sound.playPop();
            onTogglePalmRejection();
          }}
          className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-full font-extrabold text-[11px] sm:text-xs border-2 transition-all inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${
            palmRejection
              ? 'bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200'
              : 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
          }`}
          title={
            palmRejection
              ? 'Palm Rejection ON: Touch ignored, only stylus draws. Tap to allow touch.'
              : 'Finger & Stylus Mode: Any touch or pen draws. Tap for Palm Rejection.'
          }
        >
          {palmRejection ? (
            <>
              <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span className="font-extrabold leading-none">Pen Guard</span>
              {isStylusActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 shrink-0" />
              )}
            </>
          ) : (
            <>
              <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              <span className="font-extrabold leading-none">Touch & Pen</span>
            </>
          )}
        </button>
      </div>

      {/* Right Controls: Undo/Redo, Sound, Camera, Fullscreen, Party Star */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Undo */}
        <button
          onClick={() => {
            if (canUndo) {
              sound.playWhoosh();
              onUndo();
            }
          }}
          disabled={!canUndo}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl inline-flex items-center justify-center font-bold transition-all shrink-0 ${
            canUndo
              ? 'bg-kid-blueLight text-kid-blue border-2 border-kid-blue/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5'
              : 'bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Redo */}
        <button
          onClick={() => {
            if (canRedo) {
              sound.playWhoosh();
              onRedo();
            }
          }}
          disabled={!canRedo}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl inline-flex items-center justify-center font-bold transition-all shrink-0 ${
            canRedo
              ? 'bg-kid-blueLight text-kid-blue border-2 border-kid-blue/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5'
              : 'bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Export / Save Photo */}
        <button
          onClick={() => {
            sound.playPop();
            onExportImage();
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-kid-pinkLight text-kid-pink border-2 border-kid-pink/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5 transition-all inline-flex items-center justify-center shrink-0"
          title="Save to Photo Gallery"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Celebration Star (Confetti + Fanfare) */}
        <button
          onClick={onCelebrate}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-kid-yellow text-amber-800 border-2 border-amber-300 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5 transition-all inline-flex items-center justify-center animate-pulse shrink-0"
          title="I'm Finished! (Celebration Party)"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-700" />
        </button>

        {/* Mute Sound */}
        <button
          onClick={onToggleMute}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 text-gray-600 border-2 border-slate-200 shadow-sm hover:bg-slate-200 active:translate-y-0.5 transition-all inline-flex items-center justify-center shrink-0"
          title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          )}
        </button>

        {/* Fullscreen Button (Visible on medium+ screens) */}
        <button
          onClick={onToggleFullscreen}
          className="hidden md:inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 text-gray-600 border-2 border-slate-200 shadow-sm hover:bg-slate-200 active:translate-y-0.5 transition-all items-center justify-center shrink-0"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          ) : (
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          )}
        </button>
      </div>
    </header>
  );
};

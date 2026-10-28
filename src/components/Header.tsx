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
    <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b-4 border-kid-yellow/40 px-3 sm:px-6 flex items-center justify-between select-none shadow-sm z-30">
      {/* Left: Bookshelf button & Page Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => {
            sound.playPop();
            onOpenBookshelf();
          }}
          className="h-11 sm:h-13 px-3.5 sm:px-5 bg-kid-yellow rounded-2xl font-bold text-gray-800 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1 transition-all flex items-center gap-2 text-sm sm:text-base border-2 border-amber-300"
          title="Choose a Colouring Page"
        >
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-900" />
          <span className="hidden sm:inline">Book</span>
        </button>

        <div className="flex flex-col">
          <h1 className="text-base sm:text-xl font-extrabold text-gray-800 leading-tight truncate max-w-[150px] sm:max-w-xs">
            {pageTitle}
          </h1>
          <span className="text-xs sm:text-sm font-semibold text-kid-pink">
            Page {pageIndex + 1} of {totalPages}
          </span>
        </div>
      </div>

      {/* Center: Stylus & Palm Rejection Mode Pill */}
      <div className="flex items-center">
        <button
          onClick={() => {
            sound.playPop();
            onTogglePalmRejection();
          }}
          className={`h-10 sm:h-12 px-3 sm:px-4 rounded-full font-bold text-xs sm:text-sm border-2 transition-all flex items-center gap-2 shadow-sm ${
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
              <PenTool className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="hidden md:inline">✍️ Pen Guard ON</span>
              <span className="md:hidden">✍️ Pen</span>
              {isStylusActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
              )}
            </>
          ) : (
            <>
              <Hand className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">👆 Touch & Pen</span>
              <span className="md:hidden">👆 Touch</span>
            </>
          )}
        </button>
      </div>

      {/* Right Controls: Undo/Redo, Sound, Camera, Fullscreen, Party Star */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Undo */}
        <button
          onClick={() => {
            if (canUndo) {
              sound.playWhoosh();
              onUndo();
            }
          }}
          disabled={!canUndo}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${
            canUndo
              ? 'bg-kid-blueLight text-kid-blue border-2 border-kid-blue/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1'
              : 'bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo2 className="w-5 h-5 sm:w-6 sm:h-6" />
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
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${
            canRedo
              ? 'bg-kid-blueLight text-kid-blue border-2 border-kid-blue/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1'
              : 'bg-gray-100 text-gray-300 border-2 border-gray-200 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Export / Save Photo */}
        <button
          onClick={() => {
            sound.playPop();
            onExportImage();
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-kid-pinkLight text-kid-pink border-2 border-kid-pink/40 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1 transition-all flex items-center justify-center"
          title="Save to Photo Gallery"
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Celebration Star (Confetti + Fanfare) */}
        <button
          onClick={onCelebrate}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-kid-yellow text-amber-800 border-2 border-amber-300 shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1 transition-all flex items-center justify-center animate-pulse"
          title="I'm Finished! (Celebration Party)"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-700" />
        </button>

        {/* Mute Sound */}
        <button
          onClick={onToggleMute}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 text-gray-600 border-2 border-slate-200 shadow-sm hover:bg-slate-200 active:translate-y-1 transition-all flex items-center justify-center"
          title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
          ) : (
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          )}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 text-gray-600 border-2 border-slate-200 shadow-sm hover:bg-slate-200 active:translate-y-1 transition-all items-center justify-center"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          ) : (
            <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          )}
        </button>
      </div>
    </header>
  );
};

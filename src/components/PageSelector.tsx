import React from 'react';
import { PageMetadata, PageDrawingState } from '../types/colouring';
import { ArrowLeft, Sparkles, Star, Palette } from 'lucide-react';
import { sound } from '../utils/audioEngine';

interface PageSelectorProps {
  pages: PageMetadata[];
  savedPages: Record<string, PageDrawingState>;
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
  onClose: () => void;
}

export const PageSelector: React.FC<PageSelectorProps> = ({
  pages,
  savedPages,
  currentPageId,
  onSelectPage,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-kid-pinkLight/95 backdrop-blur-md overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl bg-white text-gray-800 font-extrabold text-base sm:text-lg shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1 transition-all flex items-center gap-2 border-2 border-kid-yellow"
        >
          <ArrowLeft className="w-6 h-6 text-kid-pink" />
          <span>Back to Coloring</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-gray-800 flex items-center justify-center gap-2">
            <span>Coloring Book</span>
            <span className="text-kid-pink">🎨</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">
            Tap any picture to color!
          </p>
        </div>

        <div className="w-20 hidden sm:block" />
      </div>

      {/* Pages Card Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 pb-12">
        {pages.map((page, idx) => {
          const isSelected = page.id === currentPageId;
          const saved = savedPages[page.id];
          const hasDrawing = saved && saved.actions && saved.actions.length > 0;
          const isCompleted = saved?.completed;

          return (
            <button
              key={page.id}
              onClick={() => {
                sound.playPop();
                onSelectPage(page.id);
              }}
              className={`group relative bg-white rounded-3xl p-3 sm:p-4 text-left transition-all border-4 flex flex-col items-center ${
                isSelected
                  ? 'border-kid-pink ring-4 ring-kid-pink/30 shadow-2xl scale-[1.02] -translate-y-1'
                  : 'border-kid-yellow/60 hover:border-kid-pink hover:shadow-xl active:scale-95'
              }`}
            >
              {/* Card Image Thumbnail */}
              <div
                className="w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-100 shadow-inner"
                style={{ aspectRatio: '800 / 1000' }}
              >
                {/* If saved artwork thumbnail snapshot exists, show it; otherwise show blank line art */}
                <img
                  src={saved?.snapshot || `/colouring-pages/${page.filename}`}
                  alt={page.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Status Badges */}
                {isCompleted ? (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md animate-bounce">
                    <Star className="w-3.5 h-3.5 fill-amber-950" />
                    <span>Done! ⭐</span>
                  </div>
                ) : hasDrawing ? (
                  <div className="absolute top-2 right-2 bg-kid-blue text-white px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Painting 🎨</span>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>New ✨</span>
                  </div>
                )}
              </div>

              {/* Title & Page Number */}
              <div className="w-full mt-3 flex items-center justify-between px-1">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base sm:text-lg group-hover:text-kid-pink transition-colors">
                    {page.title}
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">
                    Page {idx + 1}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-kid-pinkLight flex items-center justify-center text-kid-pink font-bold text-sm">
                  {idx + 1}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

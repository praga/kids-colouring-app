import React, { useState } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories preserving order
  const categoryList: string[] = ['All'];
  pages.forEach(p => {
    if (p.category && !categoryList.includes(p.category)) {
      categoryList.push(p.category);
    }
  });

  const filteredPages = selectedCategory === 'All'
    ? pages
    : pages.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-40 bg-kid-pinkLight/95 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-hidden animate-fade-in">
      {/* Top Header - Fixed / Pinned */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-3 sm:mb-4 shrink-0">
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="h-10 sm:h-12 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-white text-gray-800 font-extrabold text-xs sm:text-base shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5 transition-all flex items-center gap-1.5 border-2 border-kid-yellow shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-kid-pink" />
          <span>Back</span>
        </button>

        <div className="text-center min-w-0 px-2">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-800 flex items-center justify-center gap-1.5 truncate">
            <span>Coloring Book</span>
            <span className="text-kid-pink">🎨</span>
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500">
            Tap any picture to color!
          </p>
        </div>

        <div className="w-16 hidden sm:block shrink-0" />
      </div>

      {/* Category Filter Pills - Fixed / Pinned */}
      <div className="max-w-6xl mx-auto w-full flex items-center gap-2 overflow-x-auto py-2 px-1 mb-3 sm:mb-4 no-scrollbar shrink-0">
        {categoryList.map(cat => {
          const isCatActive = selectedCategory === cat;
          const count = cat === 'All' ? pages.length : pages.filter(p => p.category === cat).length;
          
          let displayLabel = cat;
          if (cat === 'All') displayLabel = '🌟 All Pages';
          else if (cat === 'K-Pop Demon Hunters') displayLabel = '⚔️ K-Pop';
          else if (cat === 'Fairy Tale') displayLabel = '🦄 Fairy Tale';
          else if (cat === 'Animals') displayLabel = '🐾 Animals';
          else if (cat === 'Adventure') displayLabel = '🚀 Adventure';
          else if (cat === 'Ocean') displayLabel = '🐢 Ocean';

          return (
            <button
              key={cat}
              onClick={() => {
                sound.playPop();
                setSelectedCategory(cat);
              }}
              className={`h-9 sm:h-11 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all border-2 inline-flex items-center gap-2 shrink-0 ${
                isCatActive
                  ? 'bg-kid-pink text-white border-kid-pink shadow-md scale-105'
                  : 'bg-white text-gray-700 border-kid-yellow/60 hover:border-kid-pink hover:bg-pink-50'
              }`}
            >
              <span className="leading-none">{displayLabel}</span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black leading-none inline-flex items-center justify-center ${
                  isCatActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pages Card Grid - Independently Scrollable */}
      <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 overflow-y-auto pr-1 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredPages.map((page, idx) => {
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
                className={`group relative bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-left transition-all border-3 sm:border-4 flex flex-col items-center ${
                  isSelected
                    ? 'border-kid-pink ring-3 ring-kid-pink/30 shadow-xl scale-[1.01]'
                    : 'border-kid-yellow/60 hover:border-kid-pink hover:shadow-lg active:scale-95'
                }`}
              >
                {/* Card Image Thumbnail */}
                <div
                  className="w-full bg-slate-50 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-100 shadow-inner"
                  style={{ aspectRatio: '800 / 1000' }}
                >
                  <img
                    src={saved?.snapshot || `/colouring-pages/${page.filename}`}
                    alt={page.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Status Badges */}
                  {isCompleted ? (
                    <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black inline-flex items-center gap-1 shadow-md animate-bounce">
                      <Star className="w-3 h-3 fill-amber-950 shrink-0" />
                      <span className="leading-none">Done! ⭐</span>
                    </div>
                  ) : hasDrawing ? (
                    <div className="absolute top-2 right-2 bg-kid-blue text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black inline-flex items-center gap-1 shadow-md">
                      <Palette className="w-3 h-3 shrink-0" />
                      <span className="leading-none">Painting 🎨</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black inline-flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="leading-none">New ✨</span>
                    </div>
                  )}
                </div>

                {/* Title & Page Number */}
                <div className="w-full mt-2.5 sm:mt-3 flex items-center justify-between px-1.5 pb-0.5">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm md:text-base leading-snug truncate group-hover:text-kid-pink transition-colors">
                      {page.title}
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 leading-tight block mt-0.5">
                      Page {idx + 1}
                    </span>
                  </div>

                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-kid-pinkLight inline-flex items-center justify-center text-kid-pink font-black text-xs sm:text-sm shrink-0 border border-kid-pink/20">
                    {idx + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

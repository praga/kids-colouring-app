import React from 'react';
import { Sparkles, Trash2, Heart } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-sm sm:max-w-md w-full text-center shadow-2xl border-4 border-kid-yellow flex flex-col items-center max-h-[90dvh] overflow-y-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-kid-pinkLight rounded-full flex items-center justify-center mb-3 sm:mb-4 text-3xl sm:text-4xl shadow-inner animate-bounce shrink-0">
          🧼
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-2 leading-tight">
          Start Fresh? 🎨
        </h2>

        <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed max-w-xs sm:max-w-sm">
          Do you want to clean this page and start coloring again?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl sm:rounded-2xl bg-kid-pink text-white font-extrabold text-sm sm:text-base shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white shrink-0" />
            <span>Keep Coloring!</span>
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold text-sm sm:text-base border-2 border-slate-300 active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0" />
            <span>Clean Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};

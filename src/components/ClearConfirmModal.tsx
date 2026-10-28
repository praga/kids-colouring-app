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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-kid-yellow flex flex-col items-center">
        <div className="w-20 h-20 bg-kid-pinkLight rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner animate-bounce">
          🧼
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
          Start Fresh? 🎨
        </h2>

        <p className="text-gray-600 text-base sm:text-lg mb-6">
          Do you want to clean this page and start coloring again?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-kid-pink text-white font-bold text-lg shadow-bubbly hover:brightness-105 active:shadow-bubbly-active active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-6 h-6 fill-white" />
            Keep Coloring!
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-200 text-gray-700 font-bold text-lg hover:bg-slate-300 active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Yes, Clean Page
          </button>
        </div>
      </div>
    </div>
  );
};

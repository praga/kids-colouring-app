import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ToolType,
  BrushSize,
  DrawingAction,
  PageMetadata,
  PageDrawingState
} from './types/colouring';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { ColouringCanvas, ColouringCanvasRef } from './components/ColouringCanvas';
import { PageSelector } from './components/PageSelector';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { sound } from './utils/audioEngine';
import {
  savePageDrawing,
  loadPageDrawing,
  getAllSavedPages,
  clearPageDrawing
} from './utils/offlineStorage';

// Fallback pages list in case network fetch is delayed in offline mode
const FALLBACK_PAGES: PageMetadata[] = [
  { id: 'kpop-huntrix-heroes', title: 'K-Pop Demon Hunters ⚔️', filename: 'kpop-huntrix-heroes.png', category: 'K-Pop Demon Hunters', order: 1, featured: true },
  { id: 'kpop-huntrix-concert', title: 'Superstar Concert 🎤', filename: 'kpop-huntrix-concert.png', category: 'K-Pop Demon Hunters', order: 2, featured: true },
  { id: 'kpop-rumi-superstar', title: 'Rumi Super Star 💖', filename: 'kpop-rumi-superstar.png', category: 'K-Pop Demon Hunters', order: 3, featured: true },
  { id: 'kpop-rumi-half-demon', title: 'Rumi Mystic Marks ✨', filename: 'kpop-rumi-half-demon.png', category: 'K-Pop Demon Hunters', order: 4, featured: false },
  { id: 'kpop-rumi-singing', title: 'Rumi Live on Stage 🎙️', filename: 'kpop-rumi-singing.png', category: 'K-Pop Demon Hunters', order: 5, featured: false },
  { id: 'kpop-mira-warrior', title: 'Mira Sword Dance 🗡️', filename: 'kpop-mira-warrior.png', category: 'K-Pop Demon Hunters', order: 6, featured: false },
  { id: 'kpop-mira-ramyeon', title: 'Chibi Mira & Noodles 🍜', filename: 'kpop-mira-ramyeon.png', category: 'K-Pop Demon Hunters', order: 7, featured: false },
  { id: 'kpop-zoey-shinkal', title: 'Zoey Dual Daggers ⚡', filename: 'kpop-zoey-shinkal.png', category: 'K-Pop Demon Hunters', order: 8, featured: false },
  { id: 'kpop-zoey-portrait', title: 'Zoey Fashion Idol 🎀', filename: 'kpop-zoey-portrait.png', category: 'K-Pop Demon Hunters', order: 9, featured: false },
  { id: 'kpop-zoey-singing', title: 'Zoey Smiling Vocalist 🎶', filename: 'kpop-zoey-singing.png', category: 'K-Pop Demon Hunters', order: 10, featured: false },
  { id: 'kpop-saja-boys-band', title: 'The Saja Boys 🦁', filename: 'kpop-saja-boys-band.png', category: 'K-Pop Demon Hunters', order: 11, featured: false },
  { id: 'kpop-jinu-sunglasses', title: 'Jinu Cool Shades 😎', filename: 'kpop-jinu-sunglasses.png', category: 'K-Pop Demon Hunters', order: 12, featured: false },
  { id: 'kpop-baby-saja', title: 'Baby Saja Cutie 💫', filename: 'kpop-baby-saja.png', category: 'K-Pop Demon Hunters', order: 13, featured: false },
  { id: 'kpop-rumi-jinu-duet', title: 'Rumi & Jinu Duet 🎶', filename: 'kpop-rumi-jinu-duet.png', category: 'K-Pop Demon Hunters', order: 14, featured: false },
  { id: 'kpop-derpy-tiger', title: 'Derpy Tiger Spirit 🐯', filename: 'kpop-derpy-tiger.png', category: 'K-Pop Demon Hunters', order: 15, featured: true },
  { id: 'kpop-derpy-wizard', title: 'Derpy Magic Hat 🎩', filename: 'kpop-derpy-wizard.png', category: 'K-Pop Demon Hunters', order: 16, featured: false },
  { id: 'kpop-sussie-pigeon', title: 'Sussie the Pigeon 🐦', filename: 'kpop-sussie-pigeon.png', category: 'K-Pop Demon Hunters', order: 17, featured: false },
  { id: 'unicorn-rainbow', title: 'Magical Unicorn 🦄', filename: 'unicorn.svg', category: 'Fairy Tale', order: 18, featured: false },
  { id: 'cute-dinosaur', title: 'Baby Dino 🦕', filename: 'dinosaur.svg', category: 'Animals', order: 19, featured: false },
  { id: 'princess-castle', title: 'Fairy Princess 👑', filename: 'princess-castle.svg', category: 'Fairy Tale', order: 20, featured: false },
  { id: 'puppy-kitten', title: 'Puppy & Kitten 🐶🐱', filename: 'puppy-kitten.svg', category: 'Animals', order: 21, featured: false },
  { id: 'space-rocket', title: 'Space Rocket 🚀', filename: 'space-rocket.svg', category: 'Adventure', order: 22, featured: false },
  { id: 'ocean-turtle', title: 'Sea Turtle 🐢', filename: 'ocean-turtle.svg', category: 'Ocean', order: 23, featured: false }
];

export const App: React.FC = () => {
  const canvasRef = useRef<ColouringCanvasRef>(null);

  // Pages & Navigation
  const [pages, setPages] = useState<PageMetadata[]>(FALLBACK_PAGES);
  const [currentPageId, setCurrentPageId] = useState<string>('kpop-huntrix-heroes');
  const [savedPages, setSavedPages] = useState<Record<string, PageDrawingState>>({});
  const [isBookshelfOpen, setIsBookshelfOpen] = useState<boolean>(false);

  // Drawing tools & settings
  const [currentTool, setCurrentTool] = useState<ToolType>('crayon');
  const [currentColor, setCurrentColor] = useState<string>('#FF6B8B'); // Bubblegum pink
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');

  // Palm Rejection & Hardware Stylus state
  // Default: false so finger painting works immediately; auto-activates when stylus is detected
  const [palmRejection, setPalmRejection] = useState<boolean>(false);
  const [isStylusActive, setIsStylusActive] = useState<boolean>(false);

  // Action history and undo/redo stacks
  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingAction[]>([]);

  // UI state
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Load pages catalog
  useEffect(() => {
    fetch('/colouring-pages/pages.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Fallback to local');
      })
      .then((data: PageMetadata[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPages(data);
          if (!currentPageId) {
            setCurrentPageId(data[0].id);
          }
        }
      })
      .catch(() => {
        // Use bundled fallback pages
      });
  }, [currentPageId]);

  // Load all saved page previews from IndexedDB
  const refreshSavedPages = useCallback(async () => {
    const all = await getAllSavedPages();
    setSavedPages(all);
  }, []);

  useEffect(() => {
    refreshSavedPages();
  }, [refreshSavedPages]);

  // Load actions when switching pages
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      const saved = await loadPageDrawing(currentPageId);
      if (!isCancelled) {
        if (saved && saved.actions) {
          setActions(saved.actions);
        } else {
          setActions([]);
        }
        setUndoStack([]);
      }
    }

    loadPage();
    return () => {
      isCancelled = true;
    };
  }, [currentPageId]);

  // Auto-save actions to IndexedDB with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      let snapshot: string | undefined = undefined;
      if (canvasRef.current) {
        const thumb = canvasRef.current.generateThumbnail();
        if (thumb) snapshot = thumb;
      }
      await savePageDrawing(currentPageId, actions, snapshot);
      refreshSavedPages();
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [actions, currentPageId, refreshSavedPages]);

  // Stylus detection callback: auto-activates palm rejection
  const handleStylusDetected = (isStylus: boolean) => {
    setIsStylusActive(isStylus);
    if (isStylus && !palmRejection) {
      setPalmRejection(true);
    }
  };

  // Actions change handler
  const handleActionsChange = (newActions: DrawingAction[]) => {
    setActions(newActions);
    setUndoStack([]);
  };

  // Undo
  const handleUndo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setUndoStack([...undoStack, lastAction]);
    setActions(actions.slice(0, actions.length - 1));
  };

  // Redo
  const handleRedo = () => {
    if (undoStack.length === 0) return;
    const actionToRestore = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, undoStack.length - 1));
    setActions([...actions, actionToRestore]);
  };

  // Clear Canvas (Start over)
  const handleConfirmClear = async () => {
    sound.playWhoosh();
    setActions([]);
    setUndoStack([]);
    await clearPageDrawing(currentPageId);
    refreshSavedPages();
    setIsClearModalOpen(false);
  };

  // Celebration Fireworks / Confetti
  const handleCelebrate = () => {
    sound.playFanfare();

    // Multi-burst colorful confetti party
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  };

  // Save / Export High-Res Image to Tablet Gallery
  const handleExportImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.exportCombinedImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `my-coloring-${currentPageId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    handleCelebrate();
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentPage = pages.find((p) => p.id === currentPageId) || pages[0];
  const currentPageIndex = pages.findIndex((p) => p.id === currentPageId);

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-kid-cream overflow-hidden select-none font-bubble">
      {/* Top Header */}
      <Header
        pageTitle={currentPage.title}
        pageIndex={currentPageIndex}
        totalPages={pages.length}
        onOpenBookshelf={() => setIsBookshelfOpen(true)}
        canUndo={actions.length > 0}
        canRedo={undoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        palmRejection={palmRejection}
        onTogglePalmRejection={() => setPalmRejection(!palmRejection)}
        isStylusActive={isStylusActive}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          sound.setMuted(next);
          setIsMuted(next);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onExportImage={handleExportImage}
        onCelebrate={handleCelebrate}
      />

      {/* Main Drawing Easel Workspace */}
      <main className="flex-1 min-h-0 min-w-0 relative overflow-hidden flex items-center justify-center">
        <ColouringCanvas
          ref={canvasRef}
          pageId={currentPage.id}
          imageSrc={`/colouring-pages/${currentPage.filename}`}
          actions={actions}
          onActionsChange={handleActionsChange}
          tool={currentTool}
          color={currentColor}
          brushSize={brushSize}
          palmRejection={palmRejection}
          onStylusDetected={handleStylusDetected}
        />
      </main>

      {/* Bottom Kid Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        currentColor={currentColor}
        onSelectColor={setCurrentColor}
        brushSize={brushSize}
        onSelectBrushSize={setBrushSize}
        onOpenClearModal={() => setIsClearModalOpen(true)}
      />

      {/* Bookshelf Modal for picking pages */}
      {isBookshelfOpen && (
        <PageSelector
          pages={pages}
          savedPages={savedPages}
          currentPageId={currentPageId}
          onSelectPage={(id) => {
            setCurrentPageId(id);
            setIsBookshelfOpen(false);
          }}
          onClose={() => setIsBookshelfOpen(false)}
        />
      )}

      {/* Clear Canvas Confirmation Modal */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};

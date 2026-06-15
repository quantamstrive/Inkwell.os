import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrawingBoard, DrawingBoardRef } from './components/DrawingBoard';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { ToolType, ShapeType, BackgroundMode, Project } from './types';
import { useBoard } from './hooks/useBoard';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, FileText, RotateCcw, RotateCw, Maximize2, Grid3X3, Square, Layers, LayoutGrid, EyeOff, HelpCircle, X, MousePointer2, PenTool, Eraser, Square as SquareIcon, Circle, Triangle, Type, Download, Trash2, Command, Menu, Home, Cloud, LogOut } from 'lucide-react';

import { exportAllToPDF } from './lib/exportUtils';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { TutorialScreen } from './components/TutorialScreen';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const { 
    state, 
    addPage, 
    deletePage, 
    duplicatePage, 
    setPageData, 
    setCurrentPageId,
    setPageBackground,
    loadProjectState
  } = useBoard();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('inkwell_tutorial_completed') !== 'true';
  });
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleSkipTutorial = () => {
    localStorage.setItem('inkwell_tutorial_completed', 'true');
    setShowTutorial(false);
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  const activeProjectIdRef = useRef<string | null>(null);
  const prevPagesRef = useRef<string>('');
  const saveTimeoutRef = useRef<any>(null);

  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.Pen);
  const [activeShape, setActiveShape] = useState<ShapeType>(ShapeType.Rectangle);
  const [color, setColor] = useState('#ffffff');
  const [thickness, setThickness] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHideUI, setIsHideUI] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isBGMenuOpen, setIsBGMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const boardRef = useRef<DrawingBoardRef>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAuthLoading(false);
      if (!usr) {
        setActiveProject(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    activeProjectIdRef.current = project.id;
    prevPagesRef.current = JSON.stringify(project.pages);
    loadProjectState(project.pages, project.currentPageId);
  };

  const handleGoToMainPage = () => {
    setActiveProject(null);
    setIsMainMenuOpen(false);
  };

  const handleLogout = () => {
    signOut(auth).catch(err => console.error("Logout fail:", err));
  };

  useEffect(() => {
    if (!activeProject) {
      activeProjectIdRef.current = null;
      prevPagesRef.current = '';
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      return;
    }

    const currentPagesStr = JSON.stringify(state.pages);

    if (activeProjectIdRef.current !== activeProject.id) {
      activeProjectIdRef.current = activeProject.id;
      prevPagesRef.current = currentPagesStr;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      return;
    }

    if (currentPagesStr === prevPagesRef.current) {
      return;
    }

    // Trigger debounced autosave
    setIsSaving(true);
    setSaveMessage("SAVING...");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const projectRef = doc(db, 'projects', activeProject.id);
        await updateDoc(projectRef, {
          pages: state.pages,
          currentPageId: state.currentPageId,
          updatedAt: serverTimestamp(),
        });
        prevPagesRef.current = currentPagesStr;
        setSaveMessage("SAVED");
        setTimeout(() => setSaveMessage(null), 1500);
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveMessage("SAVE ERROR");
        setTimeout(() => setSaveMessage(null), 1500);
      } finally {
        setIsSaving(false);
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.pages, state.currentPageId, activeProject]);

  const goToPreviousPage = () => {
    const currentIndex = state.pages.findIndex(p => p.id === state.currentPageId);
    if (currentIndex > 0) {
      setCurrentPageId(state.pages[currentIndex - 1].id);
    }
  };

  const goToNextPage = () => {
    const currentIndex = state.pages.findIndex(p => p.id === state.currentPageId);
    if (currentIndex < state.pages.length - 1) {
      setCurrentPageId(state.pages[currentIndex + 1].id);
    }
  };

  const currentPageIndex = state.pages.findIndex(p => p.id === state.currentPageId);
  const totalPages = state.pages.length;

  useEffect(() => {
    if (isPresentationMode) {
      setIsHideUI(true);
      setIsSidebarOpen(false);
    }
  }, [isPresentationMode]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPage = state.pages.find(p => p.id === state.currentPageId) || state.pages[0];

  const handlePageChange = useCallback((data: any, thumbnail: string, width: number, height: number) => {
    setPageData(state.currentPageId, data, thumbnail, width, height);
  }, [state.currentPageId, setPageData]);

  const handleImportImage = () => fileInputRef.current?.click();
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && boardRef.current) boardRef.current.importImage(file);
    e.target.value = '';
  };

  const handleExportPNG = () => {
    if (boardRef.current) {
      const dataUrl = boardRef.current.exportImage();
      const link = document.createElement('a');
      link.download = `${currentPage.name}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleExportPDF = async () => {
    // Current pages state has all data
    await exportAllToPDF(state.pages);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  if (authLoading) {
    return (
      <div id="app-loading" className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Securing environment keys...</span>
      </div>
    );
  }

  if (!user) {
    if (showTutorial) {
      return <TutorialScreen onSkip={handleSkipTutorial} />;
    }
    return <AuthScreen onGoBack={() => setShowTutorial(true)} />;
  }

  if (!activeProject) {
    return (
      <Dashboard 
        user={user} 
        onSelectProject={handleSelectProject} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-[#0A0A0A] text-[#E0E0E0] font-sans overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={onFileChange}
      />

      <AnimatePresence>
        {!isHideUI && isPresentationMode && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-4 left-4 z-50"
          >
            <button 
              onClick={() => setIsPresentationMode(false)}
              className="px-4 py-2 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95"
            >
              Exit Presentation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative">
        <main className={cn(
          "flex-1 relative bg-black overflow-hidden transition-all duration-500",
          isFocusMode && "ring-[24px] ring-black ring-inset"
        )}>
          {/* Removed old expand button from left */}

          <div className={cn(
            "absolute inset-0 pointer-events-none z-50 transition-opacity duration-1000",
            isFocusMode ? "opacity-100" : "opacity-0"
          )}>
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(168,85,247,0.15)]" />
          </div>
            <DrawingBoard 
              ref={boardRef}
              pageId={state.currentPageId}
              tool={activeTool}
              shape={activeShape}
              color={color}
              thickness={thickness}
              backgroundMode={currentPage.backgroundMode}
              pageData={currentPage.data}
              onPageChange={handlePageChange}
            />

          <AnimatePresence>
            {!isHideUI && (
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="absolute top-1/2 -translate-y-1/2 left-2 md:left-6 z-40"
              >
                <Toolbar 
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  activeShape={activeShape}
                  setActiveShape={setActiveShape}
                  onAddText={() => boardRef.current?.addText()}
                  onImportImage={handleImportImage}
                  currentColor={color}
                  setColor={setColor}
                  thickness={thickness}
                  setThickness={setThickness}
                />
              </motion.div>
            )}
          </AnimatePresence>


        </main>

        {/* Sidebar on the Right */}
        <AnimatePresence mode="popLayout">
          {!isHideUI && isSidebarOpen && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220, mass: 0.8 }}
              className="z-40 h-full overflow-hidden shrink-0"
            >
              <Sidebar 
                pages={state.pages}
                currentPageId={state.currentPageId}
                onPageSelect={setCurrentPageId}
                onAddPage={addPage}
                onDeletePage={deletePage}
                onDuplicatePage={duplicatePage}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {!isHideUI && (
          <motion.footer 
            initial={{ y: isMobile ? -50 : 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? -50 : 50, opacity: 0 }}
            className="h-14 md:h-10 border-b md:border-b-0 md:border-t border-white/10 bg-[#0D0D0D] flex items-center px-4 shrink-0 z-50 gap-2 md:gap-6 justify-between md:justify-start order-first md:order-last"
          >
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="w-5 h-5 bg-white/90 rounded flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-black rounded-sm rotate-12"></div>
              </div>
              {saveMessage ? (
                <span className="font-mono text-[9px] text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 border border-[#A855F7]/20 rounded tracking-widest animate-pulse h-5 flex items-center shrink-0">
                  {saveMessage}
                </span>
              ) : (
                <span className="font-black text-[10px] tracking-tighter text-white hidden md:block uppercase truncate max-w-[150px]">
                  {activeProject?.name}
                </span>
              )}
              
              <div className="flex items-center gap-0.5 md:gap-1">
                <button 
                  onClick={() => boardRef.current?.undo()}
                  className="p-2 md:p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-all"
                  title="Undo"
                >
                  <RotateCcw size={16} className="md:w-3.5 md:h-3.5" />
                </button>
                <button 
                  onClick={() => boardRef.current?.redo()}
                  className="p-2 md:p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-all"
                  title="Redo"
                >
                  <RotateCw size={16} className="md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-1 rounded-full scale-90 md:scale-100">
                <button 
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button 
                  onClick={addPage}
                  className="p-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-all active:scale-90 group"
                  title="Add Page"
                >
                  <Plus size={16} className="transition-transform group-hover:rotate-90" />
                </button>

                <button 
                  onClick={goToNextPage}
                  disabled={currentPageIndex === totalPages - 1}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="text-[10px] font-mono text-white/40 tracking-widest min-w-[2rem] md:min-w-[3rem] text-center hidden xs:block">
                {currentPageIndex + 1} <span className="opacity-20">/</span> {totalPages}
              </div>
            </div>

            <div className="flex-1 md:flex hidden" />

            <div className="flex items-center justify-end gap-1.5 md:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-black/20">
                <button 
                  onClick={handleExportPNG}
                  className="px-2 py-1 hover:bg-white/5 rounded text-[9px] font-bold text-white/50 hover:text-white transition-all uppercase"
                >
                  PNG
                </button>
                <div className="w-px h-3 bg-white/10" />
                <button 
                  onClick={handleExportPDF}
                  className="px-2 py-1 hover:bg-white/5 rounded text-[9px] font-bold text-white/50 hover:text-white transition-all uppercase"
                >
                  PDF
                </button>
              </div>

              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsBGMenuOpen(!isBGMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-1 rounded-full border transition-all active:scale-95 font-bold uppercase tracking-widest text-[9px]",
                    isBGMenuOpen 
                      ? "bg-white text-black border-white" 
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Grid3X3 size={14} />
                  <span className="hidden md:inline">Background</span>
                </button>
                
                <AnimatePresence>
                  {isBGMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: isMobile ? -10 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: isMobile ? -10 : 10 }}
                      className={cn(
                        "absolute right-0 p-3 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-2 min-w-[160px] md:min-w-[200px] z-50",
                        isMobile ? "top-full mt-3" : "bottom-full mb-3"
                      )}
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { mode: BackgroundMode.Plain, icon: <Square size={14} />, label: 'Plain' },
                          { mode: BackgroundMode.Grid, icon: <Grid3X3 size={14} />, label: 'Grid' },
                          { mode: BackgroundMode.Lines, icon: <Layers size={14} />, label: 'Lined' }
                        ].map((item) => (
                          <button
                            key={item.mode}
                            onClick={() => { setPageBackground(state.currentPageId, item.mode); setIsBGMenuOpen(false); }}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border",
                              currentPage.backgroundMode === item.mode 
                                ? "bg-white text-black border-white" 
                                : "text-white/60 border-white/5 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {item.icon}
                            <span className="text-[8px] font-bold uppercase">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-1 rounded-full border transition-all active:scale-95 font-bold uppercase tracking-widest text-[9px] shrink-0",
                    isMainMenuOpen 
                      ? "bg-white text-black border-white" 
                      : "bg-[#A855F7]/10 border-[#A855F7]/20 text-[#D8B4FE] hover:bg-[#A855F7]/20 hover:text-white"
                  )}
                >
                  <Menu size={14} />
                  <span>Menu</span>
                </button>

                <AnimatePresence>
                  {isMainMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: isMobile ? -10 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: isMobile ? -10 : 10 }}
                      className={cn(
                        "absolute right-0 p-3 rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-2xl flex flex-col gap-2 min-w-[180px] z-[100]",
                        isMobile ? "top-full mt-3" : "bottom-full mb-3"
                      )}
                    >
                      <div className="text-[10px] text-white/50 border-b border-white/5 pb-2.5 mb-1.5 text-center font-normal font-sans tracking-normal">
                        everything is autosaved dont need to worry
                      </div>

                      <button
                        onClick={handleGoToMainPage}
                        className="flex items-center gap-2.5 p-2 rounded-xl transition-all border border-white/5 bg-white/5 hover:bg-white text-white hover:text-black text-[10px] font-bold uppercase tracking-wider text-left w-full cursor-pointer"
                      >
                        <Home size={12} />
                        <span>Go to main page</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={cn(
                  "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-1 rounded-full border transition-all active:scale-95 font-bold uppercase tracking-widest text-[9px] shrink-0",
                  isSidebarOpen 
                    ? "bg-white text-black border-white" 
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <FileText size={14} />
                <span className="hidden md:inline">Pages</span>
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInfoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setIsInfoModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[85vh] overflow-hidden bg-black border-4 border-neon-green shadow-[8px_8px_0_#000,16px_16px_0_rgba(0,255,65,0.2)] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b-4 border-grey-mid bg-grey-dark">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neon-green border-2 border-black flex items-center justify-center">
                    <div className="w-5 h-5 bg-black rotate-45"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-pixel text-neon-green leading-none">INKWELL</h2>
                    <p className="text-[10px] text-neon-cyan uppercase tracking-widest mt-2">{">>"} APPLICATION_DATA_GUIDE</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInfoModalOpen(false)}
                  className="p-3 bg-neon-pink text-black border-2 border-black hover:bg-white transition-all shadow-[2px_2px_0_#000]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* Creator Note */}
                <section>
                  <div className="bg-black border-4 border-neon-cyan p-8 shadow-[6px_6px_0_var(--color-neon-pink)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-neon-cyan -rotate-45 translate-x-6 -translate-y-6"></div>
                    <h3 className="text-neon-cyan font-pixel text-[10px] mb-6 flex items-center gap-3">
                      <div className="w-2 h-2 bg-neon-pink animate-pulse" />
                      CREATOR_LOG_V1.0
                    </h3>
                    <p className="text-white font-pixel text-[11px] leading-relaxed opacity-90 tracking-tight">
                      "I HAVE MADE IT FOR YOU GUYS. INKWELL WAS BUILT TO BE A FAST, INTUITIVE, AND BEAUTIFUL 2D DESIGN TOOL. ENJOY THE CREATIVE FREEDOM!"
                    </p>
                    <div className="flex items-center justify-between mt-8">
                      <p className="text-neon-green font-pixel text-[10px] tracking-widest">{">>"} PRAJWAL NIDWANCHE</p>
                      <div className="text-[8px] font-pixel text-white/20">CONFIDENTIAL_DATA</div>
                    </div>
                  </div>
                </section>

                {/* Tutorial Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section className="space-y-8">
                    <h3 className="text-neon-pink font-pixel text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-3 border-b-2 border-neon-pink pb-2">
                       <div className="w-2 h-2 bg-neon-pink" />
                       INTERACTION_MODULE
                    </h3>
                    
                    <div className="space-y-8">
                      <div className="flex items-start gap-6 group">
                        <div className="w-14 h-14 bg-[#111] flex items-center justify-center shrink-0 border-2 border-white group-hover:border-neon-green transition-all shadow-[4px_4px_0_#000] rotate-2">
                          <PenTool size={24} className="text-neon-green group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="text-white font-pixel text-xs tracking-tighter">PEN_ENGINE_CORE</h4>
                          <p className="text-white/40 text-[10px] mt-2 font-pixel leading-tight">SELECT_WEIGHTS: [3PX] [6PX] [10PX]. ACCESS_PRIMARY_TOOLBAR_LEFT.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6 group">
                        <div className="w-14 h-14 bg-[#111] flex items-center justify-center shrink-0 border-2 border-white group-hover:border-neon-cyan transition-all shadow-[4px_4px_0_#000] -rotate-3">
                          <MousePointer2 size={24} className="text-neon-cyan group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="text-white font-pixel text-xs tracking-tighter">TRANSFORM_LOGIC</h4>
                          <p className="text-white/40 text-[10px] mt-2 font-pixel leading-tight">DRAG_SELECT_ACTIVE. ROTATE, SCALE, TRANSLATE WITH PRECISION_ENGINE.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <h3 className="text-neon-cyan font-pixel text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-3 border-b-2 border-neon-cyan pb-2">
                      <div className="w-2 h-2 bg-neon-cyan" />
                      WORKFLOW_MODULE
                    </h3>
                    
                    <div className="space-y-8">
                      <div className="flex items-start gap-6 group">
                        <div className="w-14 h-14 bg-[#111] flex items-center justify-center shrink-0 border-2 border-white group-hover:border-neon-pink transition-all shadow-[4px_4px_0_#000] rotate-1">
                          <LayoutGrid size={24} className="text-neon-pink group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="text-white font-pixel text-xs tracking-tighter">CANVAS_RENDERER</h4>
                          <p className="text-white/40 text-[10px] mt-2 font-pixel leading-tight">MODES: [PLAIN] [GRID] [LINED]. TOGGLE_UI_OVERLAY_ACTIVE.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6 group">
                        <div className="w-14 h-14 bg-[#111] flex items-center justify-center shrink-0 border-2 border-white group-hover:border-neon-green transition-all shadow-[4px_4px_0_#000] -rotate-1">
                          <Download size={24} className="text-neon-green group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="text-white font-pixel text-xs tracking-tighter">EXPORT_PROTOCOL</h4>
                          <p className="text-white/40 text-[10px] mt-2 font-pixel leading-tight">FORMATS: [PNG] [PDF]. HIGH_RESOLUTION_BUFFER_ENABLED.</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-6 bg-grey-mid border-t-4 border-black text-center">
                <p className="text-[10px] text-neon-green font-pixel tracking-[0.4em] brightness-125">INKWELL // SYSTEM_READY</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

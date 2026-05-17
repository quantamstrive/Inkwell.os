import React, { useState } from 'react';
import { RotateCcw, RotateCw, Maximize2, ChevronDown, FileImage, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  pageName: string;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageName,
  zoom,
  onUndo,
  onRedo,
  onExportPNG,
  onExportPDF,
  onToggleFullscreen,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#070707]/80 backdrop-blur-3xl shrink-0 z-50">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <div className="w-4 h-4 bg-black rounded-md rotate-12 transition-transform hover:rotate-0"></div>
          </div>
          <span className="font-black text-base tracking-tighter text-white">INKWELL.<span className="text-blue-500">OS</span></span>
        </div>
        
        <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
        
        <nav className="hidden lg:flex gap-6 text-[11px] font-bold uppercase tracking-widest text-white/30">
          <button className="hover:text-white transition-all hover:tracking-[0.2em] duration-300">File</button>
          <button className="hover:text-white transition-all hover:tracking-[0.2em] duration-300">Edit</button>
          <button className="hover:text-white transition-all hover:tracking-[0.2em] duration-300">View</button>
          <button className="hover:text-white transition-all hover:tracking-[0.2em] duration-300">Help</button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 rounded-xl border border-white/5 bg-black/40 shadow-inner">
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">Current Stack:</span>
          <span className="text-[10px] font-bold text-white/80">{pageName}</span>
        </div>

        <div className="flex bg-black/40 rounded-xl border border-white/10 p-1 shadow-2xl">
          <button 
            onClick={onUndo}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={onRedo}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw size={14} />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] rounded-xl border border-white/10 text-[10px] font-mono text-white/60 shadow-2xl">
          <span>{zoom}%</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={onToggleFullscreen}
            className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-all"
          >
            <Maximize2 size={16} />
          </button>
          
          <div className="relative group">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-[10px] font-black rounded hover:bg-zinc-200 transition-colors uppercase italic tracking-wider"
            >
              Export
              <ChevronDown size={14} className={isExportMenuOpen ? "rotate-180" : ""} />
            </button>

            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 5, opacity: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-[60]"
                >
                  <ExportItem 
                    onClick={() => { onExportPNG(); setIsExportMenuOpen(false); }}
                    icon={<FileImage size={16} />}
                    title="Export current Page"
                    subtitle="Save as high-res PNG"
                  />
                  <ExportItem 
                    onClick={() => { onExportPDF(); setIsExportMenuOpen(false); }}
                    icon={<FileText size={16} />}
                    title="Export All Pages"
                    subtitle="Save as PDF document"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

const ExportItem: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }> = ({ onClick, icon, title, subtitle }) => (
  <button 
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3"
  >
    <div className="text-white/40 group-hover:text-white transition-colors">{icon}</div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-white/80">{title}</span>
      <span className="text-[8px] text-white/40 uppercase tracking-tighter">{subtitle}</span>
    </div>
  </button>
);

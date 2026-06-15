import React from 'react';
import { Plus, Trash2, Copy, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { BoardPage } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  pages: BoardPage[];
  currentPageId: string;
  onPageSelect: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  isOpen,
  setIsOpen,
}) => {
  return (
    <aside className="w-40 md:w-56 border-l border-white/10 bg-[#070707]/80 backdrop-blur-3xl flex flex-col shrink-0 z-40">
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "group relative aspect-video rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 shadow-xl",
                currentPageId === page.id 
                  ? "border-blue-500/50 bg-black/60 ring-1 ring-blue-500/20" 
                  : "border-white/5 bg-white/[0.02] opacity-60 hover:opacity-100 hover:border-white/10"
              )}
              onClick={() => onPageSelect(page.id)}
            >
              {/* Thumbnail */}
              <div className="w-full h-full p-1 bg-black/40">
                {page.thumbnail ? (
                  <img src={page.thumbnail} alt={page.name} className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <FileText size={24} />
                  </div>
                )}
              </div>

              {/* Index Badge */}
              <div className={cn(
                "absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold tracking-tighter",
                currentPageId === page.id ? "bg-blue-600 text-white" : "bg-black/80 text-white/40 border border-white/5"
              )}>
                SL_{index + 1 < 10 ? `0${index + 1}` : index + 1}
              </div>

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                  className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  title="Duplicate"
                >
                  <Copy size={12} className="md:w-3.5 md:h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                  className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
};

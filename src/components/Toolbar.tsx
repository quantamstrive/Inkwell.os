import React, { useState } from 'react';
import { 
  Pen, 
  Paintbrush, 
  Highlighter, 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Triangle, 
  ArrowRight, 
  Minus, 
  Type, 
  Hand, 
  MousePointer2,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { ToolType, ShapeType } from '../types';
import { cn } from '../lib/utils';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  activeShape: ShapeType;
  setActiveShape: (shape: ShapeType) => void;
  onAddText: () => void;
  onImportImage: () => void;
  currentColor: string;
  setColor: (color: string) => void;
  thickness: number;
  setThickness: (t: number) => void;
}

const COLORS = [
  '#ffffff', '#000000',
  '#3b82f6', '#ef4444', 
  '#22c55e', '#eab308', 
  '#a855f7', '#f97316', 
  '#64748b', '#ec4899'
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  activeShape,
  setActiveShape,
  onAddText,
  onImportImage,
  currentColor,
  setColor,
  thickness,
  setThickness,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const getActiveToolIcon = () => {
    switch (activeTool) {
      case ToolType.Pen: return <Pen size={18} />;
      case ToolType.Brush: return <Paintbrush size={18} />;
      case ToolType.Pencil: return <Pencil size={18} />;
      case ToolType.Highlighter: return <Highlighter size={18} />;
      case ToolType.Eraser: return <Eraser size={18} />;
      case ToolType.Text: return <Type size={18} />;
      case ToolType.Shape: return <Square size={18} />;
      case ToolType.Pan: return <Hand size={18} />;
      case ToolType.Select: return <MousePointer2 size={18} />;
      default: return <Pen size={18} />;
    }
  };

  if (isMinimized) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shrink-0">
        <ToolButton 
          active={true} 
          onClick={() => setIsMinimized(false)}
          icon={getActiveToolIcon()} 
          label="Expand Toolbar"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 md:gap-1.5 p-1 md:p-1.5 bg-black/40 backdrop-blur-3xl md:backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl shadow-2xl shrink-0 group/toolbar relative max-h-[70vh] md:max-h-none overflow-y-auto md:overflow-visible no-scrollbar">
      <button 
        onClick={() => setIsMinimized(true)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-10 flex items-center justify-center bg-black/60 border border-white/10 rounded-r-lg text-white/40 hover:text-white transition-all md:opacity-0 group-hover/toolbar:opacity-100"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex flex-col items-center gap-0.5 md:gap-1 pb-1 mb-1 border-b border-white/10 w-full">
        <ToolButton active={activeTool === ToolType.Pen} onClick={() => setActiveTool(ToolType.Pen)} icon={<Pen className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Pen (P)" />
        <ToolButton active={activeTool === ToolType.Highlighter} onClick={() => setActiveTool(ToolType.Highlighter)} icon={<Highlighter className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Highlighter" />
        <ToolButton active={activeTool === ToolType.Eraser} onClick={() => setActiveTool(ToolType.Eraser)} icon={<Eraser className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Eraser (E)" />
      </div>

      <div className="flex flex-col items-center gap-0.5 md:gap-1 pb-1 mb-1 border-b border-white/10 w-full">
        <div className="relative">
          <ToolButton 
            active={[ToolType.Pencil, ToolType.Text, ToolType.Shape].includes(activeTool) || showMore} 
            onClick={() => setShowMore(!showMore)} 
            icon={<Plus className={cn("w-4 h-4 md:w-[18px] md:h-[18px] transition-transform duration-300", showMore && "rotate-45")} />} 
            label="More Tools" 
          />
          {showMore && (
            <div className="absolute left-full top-0 ml-2 md:ml-3 flex flex-col gap-1 p-1 rounded-xl bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl z-50 max-h-[60vh] overflow-y-auto no-scrollbar">
              <ToolButton 
                active={activeTool === ToolType.Pencil} 
                onClick={() => { setActiveTool(ToolType.Pencil); setShowMore(false); }} 
                icon={<Pencil className="w-4 h-4 md:w-[18px] md:h-[18px]" />} 
                label="Pencil" 
              />
              <ToolButton 
                active={activeTool === ToolType.Text} 
                onClick={() => { onAddText(); setShowMore(false); }} 
                icon={<Type className="w-4 h-4 md:w-[18px] md:h-[18px]" />} 
                label="Text (T)" 
              />
              
              <div className="relative group/shapes">
                <ToolButton active={activeTool === ToolType.Shape} onClick={() => setActiveTool(ToolType.Shape)} icon={<Square className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Shapes" />
                <div className="absolute left-full top-0 ml-2 hidden group-hover/shapes:flex flex-col gap-1 p-1 rounded-xl bg-black/95 backdrop-blur-2xl border border-white/10 shadow-2xl z-50">
                  <MenuButton active={activeShape === ShapeType.Rectangle} onClick={() => { setActiveShape(ShapeType.Rectangle); setShowMore(false); }} icon={<Square className="w-3.5 h-3.5 md:w-4 md:h-4" />} />
                  <MenuButton active={activeShape === ShapeType.Circle} onClick={() => { setActiveShape(ShapeType.Circle); setShowMore(false); }} icon={<Circle className="w-3.5 h-3.5 md:w-4 md:h-4" />} />
                  <MenuButton active={activeShape === ShapeType.Triangle} onClick={() => { setActiveShape(ShapeType.Triangle); setShowMore(false); }} icon={<Triangle className="w-3.5 h-3.5 md:w-4 md:h-4" />} />
                  <MenuButton active={activeShape === ShapeType.Line} onClick={() => { setActiveShape(ShapeType.Line); setShowMore(false); }} icon={<Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />} />
                  <MenuButton active={activeShape === ShapeType.Arrow} onClick={() => { setActiveShape(ShapeType.Arrow); setShowMore(false); }} icon={<ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />} />
                </div>
              </div>
  
              <ToolButton active={false} onClick={() => { onImportImage(); setShowMore(false); }} icon={<ImageIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Image" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 md:gap-1 w-full">
        <ToolButton active={activeTool === ToolType.Select} onClick={() => setActiveTool(ToolType.Select)} icon={<MousePointer2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />} label="Select (V)" />
      </div>

      <div className="h-px w-full bg-white/10 my-0.5 md:my-1" />

      <div className="flex flex-col gap-1.5 md:gap-2 p-1 md:p-1.5 bg-white/5 rounded-lg md:rounded-xl border border-white/5 items-center">
        <span className="text-[6px] md:text-[7px] uppercase tracking-widest text-white/40 mb-0.5">Size</span>
        <button 
          onClick={() => setThickness(3)}
          className={cn(
            "w-7 h-7 md:w-6 md:h-6 rounded-lg flex items-center justify-center transition-all",
            thickness === 3 ? "bg-white text-black" : "text-white/40 hover:text-white hover:bg-white/10"
          )}
          title="3px"
        >
          <div className="w-1 h-1 rounded-full bg-current" />
        </button>
        <button 
          onClick={() => setThickness(6)}
          className={cn(
            "w-7 h-7 md:w-6 md:h-6 rounded-lg flex items-center justify-center transition-all",
            thickness === 6 ? "bg-white text-black" : "text-white/40 hover:text-white hover:bg-white/10"
          )}
          title="6px"
        >
          <div className="w-2 h-2 rounded-full bg-current" />
        </button>
        <button 
          onClick={() => setThickness(10)}
          className={cn(
            "w-7 h-7 md:w-6 md:h-6 rounded-lg flex items-center justify-center transition-all",
            thickness === 10 ? "bg-white text-black" : "text-white/40 hover:text-white hover:bg-white/10"
          )}
          title="10px"
        >
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-current" />
        </button>
      </div>

      <div className="h-px w-full bg-white/10 my-0.5 md:my-1" />

      <div className="grid grid-cols-2 gap-1 md:gap-1.5 p-1 bg-white/5 rounded-lg md:rounded-xl border border-white/5">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              "w-4 h-4 md:w-4 md:h-4 rounded-sm transition-all hover:scale-125 border",
              currentColor === c ? "border-white ring-1 ring-white/50" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <div className="relative w-4 h-4 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer overflow-hidden">
          <span className="text-[8px] leading-none">+</span>
          <input 
            type="color" 
            className="absolute inset-0 opacity-0 cursor-pointer scale-150" 
            onChange={(e) => setColor(e.target.value)} 
          />
        </div>
      </div>
    </div>

  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label?: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "group/toolbtn relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all duration-200",
      active ? "bg-white text-black shadow-lg scale-105" : "text-white/60 hover:text-white hover:bg-white/10"
    )}
  >
    {icon}
    {label && (
      <span className="absolute left-full ml-4 px-2 py-1 rounded-md bg-black border border-white/10 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover/toolbtn:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 hidden md:block">
        {label}
      </span>
    )}
  </button>
);

const MenuButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick} 
    className={cn(
      "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-colors",
      active ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
    )}
  >
    {icon}
  </button>
);

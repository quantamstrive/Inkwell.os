import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as fabric from 'fabric';
import { ToolType, ShapeType, BackgroundMode } from '../types';

interface DrawingBoardProps {
  tool: ToolType;
  shape: ShapeType;
  color: string;
  thickness: number;
  backgroundMode: BackgroundMode;
  pageId: string;
  pageData: any;
  onPageChange: (data: any, thumbnail: string, width: number, height: number) => void;
}

export interface DrawingBoardRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  exportImage: () => string;
  addText: () => void;
  addShape: (type: ShapeType) => void;
  importImage: (file: File) => void;
  getObjects: () => any[];
}

export const DrawingBoard = forwardRef<DrawingBoardRef, DrawingBoardProps>(({
  tool,
  shape: activeShapeState,
  color,
  thickness,
  backgroundMode,
  pageId,
  pageData,
  onPageChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const isDrawingShape = useRef(false);
  const activeShape = useRef<fabric.Object | null>(null);
  const shapeOrigin = useRef({ x: 0, y: 0 });
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const isErasing = useRef(false);

  const isLoadingRef = useRef(false);
  const lastEmittedJsonRef = useRef<string>('');
  const onPageChangeRef = useRef(onPageChange);
  const pageIdRef = useRef(pageId);

  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);

  const emitChange = useCallback(() => {
    if (!canvasRef.current || false || isLoadingRef.current) return;
    const canvas = canvasRef.current;
    const data = canvas.toObject();
    const json = JSON.stringify(data);
    lastEmittedJsonRef.current = json;
    onPageChangeRef.current(
      data, 
      canvas.toDataURL({ quality: 0.1, multiplier: 0.1 }),
      canvas.width!,
      canvas.height!
    );
  }, []);

  const saveState = useCallback(() => {
    if (!canvasRef.current || false || isLoadingRef.current) return;
    const json = JSON.stringify(canvasRef.current.toObject());
    if (undoStack.current[undoStack.current.length - 1] === json) return;
    undoStack.current.push(json);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    emitChange();
  }, [emitChange]);

  const saveStateRef = useRef(saveState);
  useEffect(() => { saveStateRef.current = saveState; }, [saveState]);

  // Unified Tool Refs to prevent stale closures in event handlers
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const thickRef = useRef(thickness);
  const shapeRef = useRef(activeShapeState);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { thickRef.current = thickness; }, [thickness]);
  useEffect(() => { shapeRef.current = activeShapeState; }, [activeShapeState]);

  useEffect(() => {
    if (!canvasWrapperRef.current || !containerRef.current) return;

    canvasWrapperRef.current.innerHTML = '';
    const htmlCanvasElement = document.createElement('canvas');
    canvasWrapperRef.current.appendChild(htmlCanvasElement);

    const canvas = new fabric.Canvas(htmlCanvasElement, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 'transparent',
      fireRightClick: true,
      stopContextMenu: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    canvas.on('mouse:down', (opt) => {
      if (canvas !== canvasRef.current) return;
      const pointer = canvas.getScenePoint(opt.e);
      const isAlt = (opt.e as any).altKey;

      if (toolRef.current === ToolType.Pan || isAlt) {
        isPanning.current = true;
        canvas.selection = false;
        lastPanPoint.current = { x: (opt.e as MouseEvent).clientX, y: (opt.e as MouseEvent).clientY };
        canvas.setCursor('grabbing');
        return;
      }

      if (toolRef.current === ToolType.Eraser) {
        isErasing.current = true;
        const objects = canvas.getObjects();
        let changed = false;
        objects.forEach(obj => {
          if (obj.containsPoint(pointer)) {
            canvas.remove(obj);
            changed = true;
          }
        });
        if (changed) {
          canvas.requestRenderAll();
        }
        return;
      }

      if (toolRef.current === ToolType.Shape) {
        isDrawingShape.current = true;
        shapeOrigin.current = pointer;
        const color = colorRef.current;
        const thick = thickRef.current;

        const common = {
          left: pointer.x,
          top: pointer.y,
          fill: 'transparent',
          stroke: color,
          strokeWidth: thick,
          selectable: false,
        };

        let obj: fabric.Object;
        switch (shapeRef.current) {
          case ShapeType.Rectangle: obj = new fabric.Rect({ ...common, width: 0, height: 0 }); break;
          case ShapeType.Circle: obj = new fabric.Circle({ ...common, radius: 0 }); break;
          case ShapeType.Triangle: obj = new fabric.Triangle({ ...common, width: 0, height: 0 }); break;
          case ShapeType.Line: obj = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { ...common }); break;
          case ShapeType.Arrow: obj = new fabric.Path(`M ${pointer.x} ${pointer.y} L ${pointer.x} ${pointer.y}`, { ...common }); break;
          default: return;
        }
        activeShape.current = obj;
        canvas.add(obj);
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (canvas !== canvasRef.current) return;
      const pointer = canvas.getScenePoint(opt.e);

      if (isPanning.current) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPanPoint.current.x;
          vpt[5] += e.clientY - lastPanPoint.current.y;
          canvas.requestRenderAll();
          lastPanPoint.current = { x: e.clientX, y: e.clientY };
        }
      } else if (isDrawingShape.current && activeShape.current) {
        const shape = activeShape.current;
        const origin = shapeOrigin.current;
        
        switch (shapeRef.current) {
          case ShapeType.Rectangle:
          case ShapeType.Triangle:
            shape.set({
              width: Math.abs(pointer.x - origin.x),
              height: Math.abs(pointer.y - origin.y),
              left: Math.min(pointer.x, origin.x),
              top: Math.min(pointer.y, origin.y),
            });
            break;
          case ShapeType.Circle:
            const radius = Math.sqrt(Math.pow(pointer.x - origin.x, 2) + Math.pow(pointer.y - origin.y, 2));
            shape.set({ radius, left: origin.x - radius, top: origin.y - radius });
            break;
          case ShapeType.Line:
            (shape as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
            break;
          case ShapeType.Arrow:
            const dx = pointer.x - origin.x;
            const dy = pointer.y - origin.y;
            const angle = Math.atan2(dy, dx);
            const len = Math.sqrt(dx*dx + dy*dy);
            const head = Math.min(20, len * 0.2);
            const x2 = pointer.x, y2 = pointer.y;
            const h1x = x2 - head * Math.cos(angle - Math.PI/6);
            const h1y = y2 - head * Math.sin(angle - Math.PI/6);
            const h2x = x2 - head * Math.cos(angle + Math.PI/6);
            const h2y = y2 - head * Math.sin(angle + Math.PI/6);
            (shape as fabric.Path).set({
              path: [['M', origin.x, origin.y], ['L', x2, y2], ['M', x2, y2], ['L', h1x, h1y], ['M', x2, y2], ['L', h2x, h2y]]
            });
            break;
        }
        canvas.requestRenderAll();
      } else if (toolRef.current === ToolType.Eraser && isErasing.current) {
        const objects = canvas.getObjects();
        let changed = false;
        objects.forEach(obj => {
          if (obj.containsPoint(pointer)) {
            canvas.remove(obj);
            changed = true;
          }
        });
        if (changed) canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:up', () => {
      if (canvas !== canvasRef.current) return;
      if (isPanning.current) {
        isPanning.current = false;
        canvas.setCursor(toolRef.current === ToolType.Pan ? 'grab' : 'default');
      }
      if (isDrawingShape.current) {
        isDrawingShape.current = false;
        if (activeShape.current) {
          activeShape.current.set({ selectable: true });
          activeShape.current = null;
          saveStateRef.current();
        }
      }
      if (isErasing.current) {
        isErasing.current = false;
        saveStateRef.current();
      }
    });

    canvas.on('object:modified', () => saveStateRef.current());
    canvas.on('path:created', () => saveStateRef.current());
    canvas.on('object:added', () => {
      saveStateRef.current();
    });

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && canvasRef.current && !false) {
        canvasRef.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        canvasRef.current.requestRenderAll();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      canvasRef.current = null;
      try {
        const p = canvas.dispose();
        if (p && typeof (p as any).catch === 'function') {
           (p as any).catch(() => {});
        }
      } catch(e) {}
      
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const isDrawing = [ToolType.Pen, ToolType.Brush, ToolType.Calligraphy, ToolType.Highlighter, ToolType.Pencil].includes(tool);
    canvas.isDrawingMode = isDrawing;
    
    // Only allow area selection if the Select tool is active
    canvas.selection = tool === ToolType.Select;
    
    // Skip target finding for tools that shouldn't interact with existing objects directly through Fabric's default selection
    // But allow it for Select and Eraser (if we want to highlight? eraser currently uses manual containsPoint)
    canvas.skipTargetFind = tool !== ToolType.Select;
    
    canvas.defaultCursor = tool === ToolType.Pan ? 'grab' : 
                           tool === ToolType.Select ? 'default' :
                           (tool === ToolType.Shape || tool === ToolType.Eraser) ? 'crosshair' : 'default';

    // Disable object interactive controls unless Select tool is used
    canvas.forEachObject(obj => {
      obj.selectable = tool === ToolType.Select;
      obj.evented = tool === ToolType.Select || tool === ToolType.Eraser; // Eraser needs evented for some detection patterns, though currently manual
    });

    if (isDrawing) {
      const brush = new fabric.PencilBrush(canvas);
      const hexColor = color.startsWith('#') ? color : '#ffffff';
      brush.color = hexColor;
      brush.width = thickness;
      
      if (tool === ToolType.Highlighter) {
        brush.color = hexColor + '40';
        brush.width = thickness * 6;
      } else if (tool === ToolType.Brush) {
        brush.width = thickness * 4;
        brush.strokeLineJoin = brush.strokeLineCap = 'round';
      }
      canvas.freeDrawingBrush = brush;
    }
  }, [tool, color, thickness]);

  const lastLoadedPageIdRef = useRef<string>(pageId);

  useEffect(() => {
    if (!canvasRef.current || false) return;
    const canvas = canvasRef.current;
    let isCurrent = true;

    // If switching pages, we should sync even if data is null (which means a blank page)
    const loadData = pageData || { objects: [], background: 'transparent' };
    
    // Check if this is truly a new load requirement
    const loadDataStr = JSON.stringify(loadData);
    const isNewPage = pageId !== lastLoadedPageIdRef.current;
    
    // Only reload if page ID changed OR if content changed from OUTSIDE the board
    if (!isNewPage && loadDataStr === lastEmittedJsonRef.current) {
      return;
    }

    isLoadingRef.current = true;
    lastLoadedPageIdRef.current = pageId;

    canvas.loadFromJSON(loadData).then(() => {
      if (!isCurrent || canvas !== canvasRef.current) return;
      canvas.renderAll();
      const finalJson = JSON.stringify(canvas.toObject());
      undoStack.current = [finalJson];
      lastEmittedJsonRef.current = finalJson;
      redoStack.current = [];
      isLoadingRef.current = false;
    });

    return () => { isCurrent = false; };
  }, [pageId, pageData]);

  useImperativeHandle(ref, () => ({
    clear: () => { 
      if (!canvasRef.current) return;
      canvasRef.current.remove(...canvasRef.current.getObjects()); 
      canvasRef.current.requestRenderAll();
      saveState(); 
    },
    undo: () => {
      if (undoStack.current.length > 1 && canvasRef.current && !false) {
        isLoadingRef.current = true;
        redoStack.current.push(undoStack.current.pop()!);
        const last = undoStack.current[undoStack.current.length - 1];
        canvasRef.current.loadFromJSON(JSON.parse(last)).then(() => {
          if (canvasRef.current && !false) {
            canvasRef.current.renderAll();
            isLoadingRef.current = false;
            emitChange();
          }
        });
      }
    },
    redo: () => {
      if (redoStack.current.length > 0 && canvasRef.current && !false) {
        isLoadingRef.current = true;
        const next = redoStack.current.pop()!;
        undoStack.current.push(next);
        canvasRef.current.loadFromJSON(JSON.parse(next)).then(() => {
          if (canvasRef.current && !false) {
            canvasRef.current.renderAll();
            isLoadingRef.current = false;
            emitChange();
          }
        });
      }
    },
    exportImage: () => canvasRef.current?.toDataURL({ format: 'png', multiplier: 2 }) || '',
    addText: () => {
      if (!canvasRef.current || false) return;
      const vCenter = canvasRef.current.getVpCenter();
      const text = new fabric.IText('Double Tap', {
        left: vCenter.x, top: vCenter.y, fontFamily: 'Inter', fill: color, fontSize: thickness * 5, originX: 'center', originY: 'center'
      });
      canvasRef.current.add(text);
      canvasRef.current.setActiveObject(text);
      saveState();
    },
    addShape: () => {}, // Handled via drag
    importImage: (file: File) => {
      const reader = new FileReader();
      reader.onload = (f) => {
        fabric.FabricImage.fromURL(f.target?.result as string).then(img => {
          if (!canvasRef.current || false) return;
          img.scaleToWidth(500);
          const vCenter = canvasRef.current.getVpCenter();
          img.set({ left: vCenter.x, top: vCenter.y, originX: 'center', originY: 'center' });
          canvasRef.current.add(img);
          saveState();
        });
      };
      reader.readAsDataURL(file);
    },
    getObjects: () => canvasRef.current?.getObjects() || []
  }));

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-[#0a0a0a] transition-all duration-300 touch-none"
      style={backgroundMode === BackgroundMode.Grid ? {
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1.5px, transparent 1.5px)',
        backgroundSize: '40px 40px',
      } : backgroundMode === BackgroundMode.Lines ? {
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1.5px, transparent 1.5px)',
        backgroundSize: '100% 40px',
      } : {}}
    >
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-10" />
      <div ref={canvasWrapperRef} className="w-full h-full" />
    </div>
  );
});

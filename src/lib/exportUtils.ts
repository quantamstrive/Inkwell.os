import { jsPDF } from 'jspdf';
import * as fabric from 'fabric';
import { BoardPage, BackgroundMode } from '../types';

export const exportAllToPDF = async (pages: BoardPage[]) => {
  const firstPage = pages[0];
  const firstW = firstPage.width || 1920;
  const firstH = firstPage.height || 1080;

  const doc = new jsPDF({
    orientation: firstW > firstH ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstW, firstH]
  });

  const offscreenCanvas = new fabric.StaticCanvas(null);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pW = page.width || 1920;
    const pH = page.height || 1080;
    
    if (i > 0) {
      doc.addPage([pW, pH], pW > pH ? 'landscape' : 'portrait');
    }

    offscreenCanvas.setDimensions({ width: pW, height: pH });
    
    // Set background color
    offscreenCanvas.backgroundColor = '#000000';
    
    // Load page data
    if (page.data) {
      await offscreenCanvas.loadFromJSON(page.data);
    } else {
      offscreenCanvas.clear();
      offscreenCanvas.backgroundColor = '#000000';
    }

    // Handle background patterns (since they are CSS-based in UI)
    // We can draw them on the static canvas
    if (page.backgroundMode === BackgroundMode.Grid) {
      const dotRadius = 1.5;
      const spacing = 40;
      for (let x = 0; x <= pW; x += spacing) {
        for (let y = 0; y <= pH; y += spacing) {
          const dot = new fabric.Circle({
            left: x,
            top: y,
            radius: dotRadius,
            fill: 'rgba(255,255,255,0.25)',
            selectable: false,
            evented: false,
          });
          offscreenCanvas.insertAt(0, dot);
        }
      }
    } else if (page.backgroundMode === BackgroundMode.Lines) {
      const spacing = 40;
      for (let y = 0; y <= pH; y += spacing) {
        const line = new fabric.Line([0, y, pW, y], {
          stroke: 'rgba(255,255,255,0.2)',
          strokeWidth: 1.5,
          selectable: false,
          evented: false,
        });
        offscreenCanvas.insertAt(0, line);
      }
    }

    offscreenCanvas.renderAll();

    const dataUrl = offscreenCanvas.toDataURL({
      format: 'png',
      multiplier: 2, // Better quality
    });

    // Add black background to PDF page 
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pW, pH, 'F');
    
    doc.addImage(dataUrl, 'PNG', 0, 0, pW, pH);
  }

  doc.save('inkwell-whiteboard.pdf');
  offscreenCanvas.dispose();
};

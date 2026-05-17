import { jsPDF } from 'jspdf';
import * as fabric from 'fabric';
import { BoardPage, BackgroundMode } from '../types';

export const exportAllToPDF = async (pages: BoardPage[]) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080]
  });

  const offscreenCanvas = new fabric.StaticCanvas(null, {
    width: 1920,
    height: 1080,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    // Set background color
    offscreenCanvas.backgroundColor = '#000000';
    
    // Load page data
    if (page.data) {
      await offscreenCanvas.loadFromJSON(page.data);
      offscreenCanvas.renderAll();
    } else {
      offscreenCanvas.clear();
      offscreenCanvas.backgroundColor = '#000000';
      offscreenCanvas.renderAll();
    }

    // Capture image (multiplier 2 for better quality if needed, but 1 is usually fine for 1920x1080)
    const dataUrl = offscreenCanvas.toDataURL({
      format: 'png',
      multiplier: 1,
    });

    if (i > 0) doc.addPage([1920, 1080], 'landscape');
    
    // Add black background to PDF page (optional if dataUrl has it)
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 1920, 1080, 'F');
    
    doc.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
  }

  doc.save('inkwell-whiteboard.pdf');
  offscreenCanvas.dispose();
};

export enum ToolType {
  Pen = 'pen',
  Brush = 'brush',
  Calligraphy = 'calligraphy',
  Highlighter = 'highlighter',
  Pencil = 'pencil',
  Eraser = 'eraser',
  Shape = 'shape',
  Text = 'text',
  Pan = 'pan',
  Select = 'select',
}

export enum ShapeType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Triangle = 'triangle',
  Arrow = 'arrow',
  Line = 'line',
  DashedLine = 'dashed-line',
}

export enum BackgroundMode {
  Plain = 'plain',
  Lines = 'lines',
  Grid = 'grid',
}

export interface BoardPage {
  id: string;
  name: string;
  data: any; // Fabric.js JSON state
  thumbnail?: string; // Base64 thumbnail
  backgroundMode: BackgroundMode;
}

export interface BoardState {
  pages: BoardPage[];
  currentPageId: string;
  lastUpdated: number;
}

import { getStroke } from 'perfect-freehand';
import { Element, Point } from '../types';

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

export function drawElement(ctx: CanvasRenderingContext2D, element: Element, theme: 'dark' | 'light' = 'light') {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (element.type === 'pencil' || element.type === 'highlighter' || element.type === 'eraser') {
    const isHighlighter = element.type === 'highlighter';
    const isEraser = element.type === 'eraser';
    
    const stroke = getStroke(element.points.map(p => [p.x, p.y, p.pressure || 0.5]), {
      size: element.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: element.points[0]?.pressure === undefined,
    });

    const pathData = getSvgPathFromStroke(stroke);
    const path = new Path2D(pathData);

    if (isEraser) {
      ctx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff';
    } else {
      ctx.fillStyle = element.color;
    }
    
    ctx.globalAlpha = isHighlighter ? 0.3 : 1;
    ctx.globalCompositeOperation = 'source-over';

    ctx.fill(path);
    ctx.globalAlpha = 1;
  } else if (element.type === 'rectangle') {
    if (element.points.length < 2) return;
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.size;
    ctx.beginPath();
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.stroke();
  } else if (element.type === 'circle') {
    if (element.points.length < 2) return;
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.size;
    ctx.beginPath();
    ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (element.type === 'line') {
    if (element.points.length < 2) return;
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.size;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (element.type === 'arrow') {
    if (element.points.length < 2) return;
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.size;
    
    const headlen = element.size * 3; // length of head in pixels
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(end.x, end.y);
    ctx.fill();
  } else if (element.type === 'text' && element.text) {
    const start = element.points[0];
    ctx.font = `${element.size * 2}px sans-serif`;
    ctx.fillStyle = element.color;
    ctx.textBaseline = 'top';
    ctx.fillText(element.text, start.x, start.y);
  }
}

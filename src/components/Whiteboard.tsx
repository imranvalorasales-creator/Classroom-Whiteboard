import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Element, Point, ToolType } from '../types';
import { drawElement } from '../utils/draw';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io-client';

interface WhiteboardProps {
  roomId: string;
  role: 'teacher' | 'student';
  socket: Socket | null;
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  locked: boolean;
  theme: 'dark' | 'light';
}

export default function Whiteboard({
  roomId,
  role,
  socket,
  currentTool,
  currentColor,
  currentSize,
  elements,
  setElements,
  locked,
  theme
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string; id: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let frameId: number;
    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background based on theme
    ctx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all elements
    elements.forEach(el => drawElement(ctx, el, theme));
    
    // Draw current element
    if (currentElement) {
      drawElement(ctx, currentElement, theme);
    }
  }, [elements, currentElement, theme]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, dimensions]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked && role === 'student') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'text') {
      if (textInput) {
        // Save previous text
        if (textInput.text.trim()) {
          const newElement: Element = {
            id: textInput.id,
            type: 'text',
            points: [{ x: textInput.x, y: textInput.y }],
            color: currentColor,
            size: currentSize,
            text: textInput.text,
            userId: socket?.id
          };
          setElements(prev => [...prev, newElement]);
          if (socket) socket.emit('draw-element', roomId, newElement);
        }
        setTextInput(null);
      } else {
        setTextInput({ x, y, text: '', id: uuidv4() });
      }
      return;
    }

    const pressure = e.pressure !== 0 ? e.pressure : 0.5;

    setIsDrawing(true);
    const newElement: Element = {
      id: uuidv4(),
      type: currentTool,
      points: [{ x, y, pressure }],
      color: currentColor,
      size: currentSize,
      userId: socket?.id
    };
    setCurrentElement(newElement);
    
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== 0 ? e.pressure : 0.5;

    const newPoints = [...currentElement.points, { x, y, pressure }];
    const updatedElement = { ...currentElement, points: newPoints };
    setCurrentElement(updatedElement);

    if (socket) {
      socket.emit('update-element', roomId, updatedElement);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    setElements(prev => [...prev, currentElement]);
    if (socket) {
      socket.emit('draw-element', roomId, currentElement);
    }
    setCurrentElement(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: locked && role === 'student' ? 'not-allowed' : 'crosshair' }}
      />
      {textInput && (
        <input
          autoFocus
          type="text"
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (textInput.text.trim()) {
                const newElement: Element = {
                  id: textInput.id,
                  type: 'text',
                  points: [{ x: textInput.x, y: textInput.y }],
                  color: currentColor,
                  size: currentSize,
                  text: textInput.text,
                  userId: socket?.id
                };
                setElements(prev => [...prev, newElement]);
                if (socket) socket.emit('draw-element', roomId, newElement);
              }
              setTextInput(null);
            }
          }}
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y,
            color: currentColor,
            fontSize: `${currentSize * 2}px`,
            background: 'transparent',
            border: '1px dashed #ccc',
            outline: 'none',
            fontFamily: 'sans-serif'
          }}
        />
      )}
    </div>
  );
}

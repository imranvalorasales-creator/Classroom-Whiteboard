import React from 'react';
import { ToolType } from '../types';
import { 
  Pencil, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type, 
  Trash2,
  Download,
  Lock,
  Unlock,
  Moon,
  Sun,
  Undo
} from 'lucide-react';
import { clsx } from 'clsx';

interface ToolbarProps {
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentSize: number;
  setCurrentSize: (size: number) => void;
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void;
  role: 'teacher' | 'student';
  locked: boolean;
  onToggleLock: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
const SIZES = [2, 4, 8, 16];

export default function Toolbar({
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  currentSize,
  setCurrentSize,
  onClear,
  onSave,
  onUndo,
  role,
  locked,
  onToggleLock,
  theme,
  onToggleTheme
}: ToolbarProps) {
  const isDark = theme === 'dark';

  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
    { id: 'highlighter', icon: <Highlighter size={20} />, label: 'Highlighter' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    { id: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
  ];

  return (
    <div className={clsx(
      "absolute z-40 flex gap-4 p-3 rounded-2xl shadow-lg border transition-all duration-500 ease-in-out",
      "md:left-4 md:top-1/2 md:-translate-y-1/2 md:flex-col md:max-h-[90vh] md:overflow-y-auto md:w-auto md:bottom-auto md:translate-x-0",
      "bottom-4 left-1/2 -translate-x-1/2 flex-row max-w-[95vw] overflow-x-auto",
      isDark ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900",
      "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    )}>
      <div className="flex md:flex-col flex-row gap-2 items-center shrink-0">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setCurrentTool(tool.id)}
            title={tool.label}
            className={clsx(
              "p-2 rounded-xl transition-colors shrink-0",
              currentTool === tool.id 
                ? (isDark ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600")
                : (isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")
            )}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className={clsx("md:w-full md:h-px w-px h-auto self-stretch shrink-0", isDark ? "bg-gray-800" : "bg-gray-200")} />

      <div className="flex md:flex-col flex-row gap-2 items-center shrink-0">
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => setCurrentColor(color)}
            className={clsx(
              "w-6 h-6 rounded-full border-2 transition-transform shrink-0",
              currentColor === color ? "scale-125 border-blue-500" : "border-transparent"
            )}
            style={{ backgroundColor: color, border: color === '#ffffff' && !isDark ? '2px solid #e5e7eb' : undefined }}
          />
        ))}
      </div>

      <div className={clsx("md:w-full md:h-px w-px h-auto self-stretch shrink-0", isDark ? "bg-gray-800" : "bg-gray-200")} />

      <div className="flex md:flex-col flex-row gap-2 items-center shrink-0">
        {SIZES.map(size => (
          <button
            key={size}
            onClick={() => setCurrentSize(size)}
            className={clsx(
              "w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0",
              currentSize === size
                ? (isDark ? "bg-gray-800" : "bg-gray-200")
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <div 
              className={clsx("rounded-full", isDark ? "bg-white" : "bg-black")} 
              style={{ width: size, height: size }} 
            />
          </button>
        ))}
      </div>

      <div className={clsx("md:w-full md:h-px w-px h-auto self-stretch shrink-0", isDark ? "bg-gray-800" : "bg-gray-200")} />

      <div className="flex md:flex-col flex-row gap-2 items-center shrink-0">
        <button
          onClick={onUndo}
          title="Undo"
          className={clsx("p-2 rounded-xl transition-colors shrink-0", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          <Undo size={20} />
        </button>
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          className={clsx("p-2 rounded-xl transition-colors shrink-0", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {role === 'teacher' && (
          <>
            <button
              onClick={onToggleLock}
              title={locked ? "Unlock Board" : "Lock Board"}
              className={clsx(
                "p-2 rounded-xl transition-colors shrink-0",
                locked 
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                  : (isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")
              )}
            >
              {locked ? <Lock size={20} /> : <Unlock size={20} />}
            </button>
            <button
              onClick={onClear}
              title="Clear Board"
              className={clsx("p-2 rounded-xl transition-colors shrink-0", isDark ? "hover:bg-gray-800 text-red-400" : "hover:bg-gray-100 text-red-600")}
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
        <button
          onClick={onSave}
          title="Save as PDF"
          className={clsx("p-2 rounded-xl transition-colors shrink-0", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}

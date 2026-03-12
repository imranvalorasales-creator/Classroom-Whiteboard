import React from 'react';
import { Page } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface PageManagerProps {
  pages: Page[];
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  onAddPage: () => void;
  role: 'teacher' | 'student';
  theme: 'dark' | 'light';
}

export default function PageManager({
  pages,
  currentPageId,
  onPageChange,
  onAddPage,
  role,
  theme
}: PageManagerProps) {
  const currentIndex = pages.findIndex(p => p.id === currentPageId);
  const isDark = theme === 'dark';

  return (
    <div className={clsx(
      "absolute z-40 flex items-center gap-4 px-4 py-2 rounded-2xl shadow-lg border transition-all duration-500 ease-in-out",
      "md:bottom-4 md:top-auto md:left-1/2 md:-translate-x-1/2",
      "top-4 left-1/2 -translate-x-1/2",
      isDark ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
    )}>
      <button
        onClick={() => onPageChange(pages[currentIndex - 1].id)}
        disabled={currentIndex === 0 || role === 'student'}
        className={clsx(
          "p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
          isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
        )}
      >
        <ChevronLeft size={20} />
      </button>

      <span className="font-medium text-sm w-20 text-center">
        {currentIndex + 1} / {pages.length}
      </span>

      <button
        onClick={() => onPageChange(pages[currentIndex + 1].id)}
        disabled={currentIndex === pages.length - 1 || role === 'student'}
        className={clsx(
          "p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
          isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
        )}
      >
        <ChevronRight size={20} />
      </button>

      {role === 'teacher' && (
        <>
          <div className={clsx("w-px h-6", isDark ? "bg-gray-800" : "bg-gray-200")} />
          <button
            onClick={onAddPage}
            className={clsx(
              "p-2 rounded-xl text-blue-500 hover:text-blue-600 transition-colors",
              isDark ? "hover:bg-gray-800" : "hover:bg-blue-50"
            )}
            title="Add New Page"
          >
            <Plus size={20} />
          </button>
        </>
      )}
    </div>
  );
}

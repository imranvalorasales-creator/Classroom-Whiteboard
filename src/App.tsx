import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import { Element, Page, RoomState, ToolType, ChatMessage } from './types';
import Whiteboard from './components/Whiteboard';
import Toolbar from './components/Toolbar';
import Chat from './components/Chat';
import PageManager from './components/PageManager';
import { clsx } from 'clsx';
import { Copy, Check } from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [userName, setUserName] = useState<string>('');
  const [joined, setJoined] = useState(false);
  
  const [pages, setPages] = useState<Page[]>([{ id: 'page-1', elements: [] }]);
  const [currentPageId, setCurrentPageId] = useState<string>('page-1');
  const [locked, setLocked] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  
  const [currentTool, setCurrentTool] = useState<ToolType>('pencil');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [currentSize, setCurrentSize] = useState<number>(4);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check URL for room ID
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
      setRole('student');
    } else {
      setRoomId(uuidv4().slice(0, 8));
      setRole('teacher');
    }
  }, []);

  useEffect(() => {
    if (!joined) return;

    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.emit('join-room', roomId, role);

    newSocket.on('room-state', (state: RoomState) => {
      setPages(state.pages);
      setCurrentPageId(state.currentPageId);
      setLocked(state.locked);
      setChat(state.chat);
    });

    newSocket.on('element-drawn', (element: Element) => {
      setPages(prev => prev.map(p => {
        if (p.id === currentPageId) {
          return { ...p, elements: [...p.elements, element] };
        }
        return p;
      }));
    });

    newSocket.on('element-updated', (element: Element) => {
      setPages(prev => prev.map(p => {
        if (p.id === currentPageId) {
          const index = p.elements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            const newElements = [...p.elements];
            newElements[index] = element;
            return { ...p, elements: newElements };
          }
          return { ...p, elements: [...p.elements, element] };
        }
        return p;
      }));
    });

    newSocket.on('element-removed', (elementId: string) => {
      setPages(prev => prev.map(p => {
        if (p.id === currentPageId) {
          return { ...p, elements: p.elements.filter(e => e.id !== elementId) };
        }
        return p;
      }));
    });

    newSocket.on('board-cleared', () => {
      setPages(prev => prev.map(p => {
        if (p.id === currentPageId) {
          return { ...p, elements: [] };
        }
        return p;
      }));
    });

    newSocket.on('page-changed', (pageId: string) => {
      setCurrentPageId(pageId);
    });

    newSocket.on('page-added', (newPage: Page) => {
      setPages(prev => [...prev, newPage]);
      setCurrentPageId(newPage.id);
    });

    newSocket.on('lock-toggled', (isLocked: boolean) => {
      setLocked(isLocked);
    });

    newSocket.on('new-message', (message: ChatMessage) => {
      setChat(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [joined, roomId, role, currentPageId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setJoined(true);
    }
  };

  const handleUndo = () => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        const myElements = p.elements.filter(e => e.userId === socket?.id);
        if (myElements.length === 0) return p;
        const lastElement = myElements[myElements.length - 1];
        const newElements = p.elements.filter(e => e.id !== lastElement.id);
        socket?.emit('remove-element', roomId, lastElement.id);
        return { ...p, elements: newElements };
      }
      return p;
    }));
  };

  const handleClear = () => {
    if (role !== 'teacher') return;
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        return { ...p, elements: [] };
      }
      return p;
    }));
    socket?.emit('clear-board', roomId);
  };

  const handleSave = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`whiteboard-${roomId}.pdf`);
  };

  const handlePageChange = (pageId: string) => {
    if (role !== 'teacher') return;
    setCurrentPageId(pageId);
    socket?.emit('change-page', roomId, pageId);
  };

  const handleAddPage = () => {
    if (role !== 'teacher') return;
    const newPage: Page = { id: `page-${uuidv4()}`, elements: [] };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
    socket?.emit('add-page', roomId, newPage);
  };

  const handleToggleLock = () => {
    if (role !== 'teacher') return;
    const newLocked = !locked;
    setLocked(newLocked);
    socket?.emit('toggle-lock', roomId, newLocked);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!joined) {
    return (
      <div className={clsx(
        "min-h-screen flex items-center justify-center p-4 transition-colors",
        theme === 'dark' ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      )}>
        <div className={clsx(
          "max-w-md w-full p-8 rounded-3xl shadow-xl border",
          theme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Virtual Classroom</h1>
            <p className={theme === 'dark' ? "text-gray-400" : "text-gray-500"}>
              {role === 'teacher' ? 'Start a new coaching session' : 'Join the live class'}
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                required
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border outline-none transition-colors",
                  theme === 'dark' 
                    ? "bg-gray-900 border-gray-700 focus:border-blue-500 text-white" 
                    : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white text-gray-900"
                )}
                placeholder="Enter your name"
              />
            </div>

            {role === 'teacher' && (
              <div className={clsx(
                "p-4 rounded-xl border text-sm",
                theme === 'dark' ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-800"
              )}>
                You are starting a new class. You will have full control over the whiteboard.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              {role === 'teacher' ? 'Start Class' : 'Join Class'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];

  return (
    <div className={clsx(
      "fixed inset-0 overflow-hidden transition-colors",
      theme === 'dark' ? "bg-gray-900" : "bg-white"
    )}>
      <Whiteboard
        roomId={roomId}
        role={role}
        socket={socket}
        currentTool={currentTool}
        currentColor={currentColor}
        currentSize={currentSize}
        elements={currentPage.elements}
        setElements={(elements) => {
          setPages(prev => prev.map(p => {
            if (p.id === currentPageId) {
              return { ...p, elements: typeof elements === 'function' ? elements(p.elements) : elements };
            }
            return p;
          }));
        }}
        locked={locked}
        theme={theme}
      />

      <Toolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        currentSize={currentSize}
        setCurrentSize={setCurrentSize}
        onClear={handleClear}
        onSave={handleSave}
        onUndo={handleUndo}
        role={role}
        locked={locked}
        onToggleLock={handleToggleLock}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <PageManager
        pages={pages}
        currentPageId={currentPageId}
        onPageChange={handlePageChange}
        onAddPage={handleAddPage}
        role={role}
        theme={theme}
      />

      <Chat
        roomId={roomId}
        userId={socket?.id || ''}
        userName={userName}
        socket={socket}
        messages={chat}
        theme={theme}
      />

      {role === 'teacher' && (
        <div className={clsx(
          "absolute z-40 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl shadow-lg border flex items-center gap-3 transition-all duration-500 ease-in-out",
          "md:top-4 md:bottom-auto",
          "top-20",
          theme === 'dark' ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
        )}>
          <span className="text-sm font-medium">Class Link</span>
          <button
            onClick={handleCopyLink}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              copied 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            )}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {locked && role === 'student' && (
        <div className={clsx(
          "absolute z-40 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-500 ease-in-out",
          "md:top-4 md:bottom-auto",
          "top-20"
        )}>
          <Lock size={16} /> Board is locked by teacher
        </div>
      )}
    </div>
  );
}

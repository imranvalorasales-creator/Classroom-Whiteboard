import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, MessageSquare, X } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';

interface ChatProps {
  roomId: string;
  userId: string;
  userName: string;
  socket: Socket | null;
  messages: ChatMessage[];
  theme: 'dark' | 'light';
}

export default function Chat({ roomId, userId, userName, socket, messages, theme }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const message: ChatMessage = {
      id: uuidv4(),
      senderId: userId,
      senderName: userName,
      text: newMessage.trim(),
      timestamp: Date.now(),
    };

    socket.emit('send-message', roomId, message);
    setNewMessage('');
  };

  return (
    <div className="absolute right-4 md:bottom-4 bottom-24 flex flex-col items-end z-50 transition-all duration-500 ease-in-out">
      {isOpen && (
        <div className={clsx(
          "w-80 h-96 mb-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-colors",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        )}>
          <div className={clsx(
            "p-4 flex justify-between items-center border-b",
            isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
          )}>
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare size={18} /> Class Chat
            </h3>
            <button onClick={() => setIsOpen(false)} className={isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}>
              <X size={20} />
            </button>
          </div>
          
          <div className={clsx(
            "flex-1 overflow-y-auto p-4 flex flex-col gap-3",
            isDark ? "bg-gray-900" : "bg-white"
          )}>
            {messages.map(msg => {
              const isMe = msg.senderId === userId;
              return (
                <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                  <span className={clsx("text-xs mb-1", isDark ? "text-gray-400" : "text-gray-500")}>
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <div className={clsx(
                    "px-3 py-2 rounded-2xl text-sm",
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : (isDark ? "bg-gray-800 text-white rounded-tl-none" : "bg-gray-100 text-gray-900 rounded-tl-none")
                  )}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className={clsx(
            "p-3 border-t flex gap-2",
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className={clsx(
                "flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-colors",
                isDark 
                  ? "bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500" 
                  : "bg-gray-100 text-gray-900 placeholder-gray-500 border border-transparent focus:border-blue-500 focus:bg-white"
              )}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
          {messages.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] flex items-center justify-center font-bold">
              !
            </span>
          )}
        </button>
      )}
    </div>
  );
}

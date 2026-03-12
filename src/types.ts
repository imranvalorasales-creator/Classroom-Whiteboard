export type ToolType = 'pencil' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Element {
  id: string;
  type: ToolType;
  points: Point[];
  color: string;
  size: number;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  userId?: string;
}

export interface Page {
  id: string;
  elements: Element[];
}

export interface RoomState {
  pages: Page[];
  currentPageId: string;
  locked: boolean;
  teacherId: string | null;
  chat: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface User {
  id: string;
  role: 'teacher' | 'student';
  name: string;
}

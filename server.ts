import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store room states
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId, role) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          elements: [],
          pages: [{ id: 'page-1', elements: [] }],
          currentPageId: 'page-1',
          locked: false,
          teacherId: role === 'teacher' ? socket.id : null,
          chat: []
        });
      }
      
      const room = rooms.get(roomId);
      if (role === 'teacher' && !room.teacherId) {
        room.teacherId = socket.id;
      }

      socket.emit("room-state", room);
      socket.to(roomId).emit("user-joined", { id: socket.id, role });
    });

    socket.on("draw-element", (roomId, element) => {
      const room = rooms.get(roomId);
      if (room && !room.locked) {
        const page = room.pages.find(p => p.id === room.currentPageId);
        if (page) {
          page.elements.push(element);
          socket.to(roomId).emit("element-drawn", element);
        }
      }
    });

    socket.on("update-element", (roomId, element) => {
      const room = rooms.get(roomId);
      if (room && !room.locked) {
        const page = room.pages.find(p => p.id === room.currentPageId);
        if (page) {
          const index = page.elements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            page.elements[index] = element;
            socket.to(roomId).emit("element-updated", element);
          }
        }
      }
    });

    socket.on("remove-element", (roomId, elementId) => {
      const room = rooms.get(roomId);
      if (room && !room.locked) {
        const page = room.pages.find(p => p.id === room.currentPageId);
        if (page) {
          page.elements = page.elements.filter(e => e.id !== elementId);
          socket.to(roomId).emit("element-removed", elementId);
        }
      }
    });

    socket.on("clear-board", (roomId) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.teacherId) {
        const page = room.pages.find(p => p.id === room.currentPageId);
        if (page) {
          page.elements = [];
          socket.to(roomId).emit("board-cleared");
        }
      }
    });

    socket.on("change-page", (roomId, pageId) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.teacherId) {
        room.currentPageId = pageId;
        io.to(roomId).emit("page-changed", pageId);
      }
    });

    socket.on("add-page", (roomId, newPage) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.teacherId) {
        room.pages.push(newPage);
        room.currentPageId = newPage.id;
        io.to(roomId).emit("page-added", newPage);
      }
    });

    socket.on("toggle-lock", (roomId, locked) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.teacherId) {
        room.locked = locked;
        io.to(roomId).emit("lock-toggled", locked);
      }
    });

    socket.on("send-message", (roomId, message) => {
      const room = rooms.get(roomId);
      if (room) {
        room.chat.push(message);
        io.to(roomId).emit("new-message", message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle teacher disconnect if needed
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

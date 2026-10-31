import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

interface SharedBagRoomState {
  users: Map<string, { socketId: string; userName: string; joinedAt: string }>;
}

const sharedBagRooms = new Map<string, SharedBagRoomState>();

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'https://drapza.com',
        'https://www.drapza.com',
        'https://www.drapza.co.in',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Join Shared Bag live room
    socket.on('shared-bag:join', (data: { shareId: string; userName?: string }) => {
      const { shareId, userName = 'Guest' } = data || {};
      if (!shareId) return;

      const roomKey = `shared-bag:${shareId}`;
      socket.join(roomKey);

      if (!sharedBagRooms.has(shareId)) {
        sharedBagRooms.set(shareId, { users: new Map() });
      }

      const room = sharedBagRooms.get(shareId)!;
      room.users.set(socket.id, {
        socketId: socket.id,
        userName,
        joinedAt: new Date().toISOString(),
      });

      console.log(`[SOCKET] User "${userName}" (${socket.id}) joined ${roomKey}. Total: ${room.users.size}`);

      // Broadcast updated presence to all room occupants
      io.to(roomKey).emit('shared-bag:presence', {
        shareId,
        activeCount: room.users.size,
        users: Array.from(room.users.values()).map((u) => u.userName),
      });
    });

    // Event: Shared user adds a product to their bag in real-time
    socket.on(
      'shared-bag:add-item',
      (data: {
        shareId: string;
        item: {
          name: string;
          price: number;
          selectedSize?: string;
          quantity?: number;
          image?: string;
        };
        userName?: string;
      }) => {
        const { shareId, item, userName = 'A friend' } = data || {};
        if (!shareId || !item) return;

        const roomKey = `shared-bag:${shareId}`;
        const timestamp = new Date().toISOString();

        console.log(`[SOCKET] Real-time Add to Bag in ${roomKey}: "${userName}" added "${item.name}"`);

        // Broadcast to ALL other clients in this shared bag room
        socket.to(roomKey).emit('shared-bag:item-added', {
          shareId,
          item,
          userName,
          timestamp,
        });

        // Also broadcast back confirmation to sender
        socket.emit('shared-bag:add-confirmed', {
          shareId,
          item,
          timestamp,
        });
      }
    );

    // Event: Shared user adds ALL items to their bag
    socket.on(
      'shared-bag:add-all',
      (data: {
        shareId: string;
        itemsCount: number;
        totalAmount?: number;
        userName?: string;
      }) => {
        const { shareId, itemsCount, totalAmount, userName = 'A friend' } = data || {};
        if (!shareId) return;

        const roomKey = `shared-bag:${shareId}`;
        const timestamp = new Date().toISOString();

        console.log(`[SOCKET] Real-time Add All in ${roomKey}: "${userName}" added all ${itemsCount} items`);

        socket.to(roomKey).emit('shared-bag:all-added', {
          shareId,
          itemsCount,
          totalAmount,
          userName,
          timestamp,
        });
      }
    );

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);

      // Clean up rooms
      sharedBagRooms.forEach((room, shareId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          const roomKey = `shared-bag:${shareId}`;
          io.to(roomKey).emit('shared-bag:presence', {
            shareId,
            activeCount: room.users.size,
            users: Array.from(room.users.values()).map((u) => u.userName),
          });
          if (room.users.size === 0) {
            sharedBagRooms.delete(shareId);
          }
        }
      });
    });
  });

  return io;
};

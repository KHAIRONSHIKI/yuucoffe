const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development. In prod, specify the exact frontend URL
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Here we could handle room joining if needed
    // socket.on('join_room', (role) => socket.join(role));

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io belum diinisialisasi!');
  }
  return io;
};

module.exports = initSocket;
module.exports.getIo = getIo;

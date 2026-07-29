require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const initSocket = require('./src/services/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

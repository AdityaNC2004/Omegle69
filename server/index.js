const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser && waitingUser.connected) {
    console.log('Pairing users:', socket.id, '<->', waitingUser.id);

    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit('partner-found');
    waitingUser.emit('partner-found');

    waitingUser = null;
  } else {
    console.log('No partner available, putting user in queue:', socket.id);
    waitingUser = socket;
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id} | reason: ${reason}`);

    // Delay cleanup by 1 second
    setTimeout(() => {
      if (waitingUser === socket) {
        waitingUser = null;
        console.log('Cleared from queue after delay:', socket.id);
      }

      if (socket.partner) {
        socket.partner.emit('partner-disconnected');
        socket.partner.partner = null;
        console.log('Notified partner of disconnect:', socket.partner.id);
      }
    }, 1000);
  });

    socket.on('next', () => {
    console.log(`User ${socket.id} clicked Next`);

    // Disconnect current partner if exists
    if (socket.partner) {
      const partner = socket.partner;

      // Notify partner
      partner.emit('partner-disconnected');
      partner.partner = null;

      // Remove pairing
      socket.partner = null;
    }

    // Match again (same logic as initial connection)
    if (waitingUser && waitingUser !== socket && waitingUser.connected) {
      console.log('Re-pairing after next:', socket.id, '<->', waitingUser.id);

      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit('partner-found');
      waitingUser.emit('partner-found');

      waitingUser = null;
    } else {
      console.log('No partner available after next:', socket.id);
      waitingUser = socket;
    }
  });



});

server.listen(5050, () => {
  console.log('✅ Server listening on port 5050');
});
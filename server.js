const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const users = {}; // socket.id → username

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Register username
  socket.on('register', (username) => {
    users[socket.id] = username;
    io.emit('userList', Object.values(users)); // update user list for everyone
  });

  // Handle message sending
  socket.on('chatMessage', ({ message, to }) => {
    const from = users[socket.id];
    if (to === 'Everyone') {
      io.emit('chatMessage', { from, message, to });
    } else {
      // send privately to one user
      const recipientSocketId = Object.keys(users).find(
        (id) => users[id] === to
      );
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('chatMessage', { from, message, to });
        socket.emit('chatMessage', { from, message, to }); // echo back to sender
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete users[socket.id];
    io.emit('userList', Object.values(users));
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
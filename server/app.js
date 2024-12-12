const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow GET and POST methods
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});
const cors = require('cors'); // Import the cors package

// Enable CORS for HTTP requests
app.use(cors());

// Set to keep track of unique connected users
let connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  connectedUsers.add(socket.id); 

  // Emit the updated user list to all clients
  io.emit('update-user-list', { userIds: Array.from(connectedUsers) });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id); // Remove user from the Set
    io.emit('update-user-list', { userIds: Array.from(connectedUsers) }); 
  });

  socket.on('mediaOffer', (data) => {
    console.log(`Received mediaOffer from ${data.from} to ${data.to}`);

// asterik

    socket.to(data.to).emit('mediaOffer', data);
  });

  // Handle media answer
  socket.on('mediaAnswer', (data) => {
    console.log(`Received mediaAnswer from ${data.from} to ${data.to}`);
    // asterik

    socket.to(data.to).emit('mediaAnswer', data);
  });

  // Handle ICE candidates
  socket.on('iceCandidate', (data) => {
    console.log(`Received ICE candidate from ${data.to}`);
    socket.to(data.to).emit('remotePeerIceCandidate', data);
  });
});

http.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});

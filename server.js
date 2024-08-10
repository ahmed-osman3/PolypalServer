const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const { ExpressPeerServer } = require("peer");

const corsOptions = {
  origin: "https://app.polypal.org",
  optionsSuccessStatus: 200,
};

const app = express();
app.use(cors(corsOptions)); // Use CORS middleware
app.get("/", (req, res, next) => res.send("Hello mate!"));

const peerServer = ExpressPeerServer(app, {
  path: "/myapp",
});

const httpServer = http.createServer(app);
const io = socketIO(httpServer, {
  cors: {
    origin: "https://app.polypal.org",
    methods: ["GET", "POST"],
    credentials: true, // If you are using cookies/authentication
  },
});
app.use("/peerjs", peerServer);

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("join-room", (roomId, peerId, uid) => {
    console.log(
      `a new user ${uid} with peerId ${peerId} has joined room ${roomId}`
    );
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", peerId, uid);
  });

  socket.on("user-toggle-video", (userId, roomId) => {
    console.log(`a new user ${userId} has toggled video in room ${roomId}`);

    socket.join("roomId");
    socket.broadcast.to(roomId).emit("user-toggle-video", userId);
  });

  socket.on("user-toggle-audio", (userId, roomId) => {
    console.log(`a new user ${userId} has toggled audio in room ${roomId}`);

    socket.join("roomId");
    socket.broadcast.to(roomId).emit("user-toggle-audio", userId);
  });

  socket.on("user-leave", (userId, roomId) => {
    console.log(`a new user ${userId} has left room ${roomId}`);
    socket.join("roomId");
    socket.broadcast.to(roomId).emit("user-leave", userId);
  });

  socket.on("send_msg", (userId, roomId, message) => {
    console.log(
      `a new user has sent to ${userId} has sent a message to  ${roomId} saying ${message.message}`
    );
    socket.join("roomId");
    socket.broadcast.to(roomId).emit("send_msg", message);
  });

  socket.on("room_join", (userId, roomId) => {
    console.log(
      `User ${userId} has indicated user has joined successfully and is passing back his info`
    );
    socket.join("roomId");

    socket.broadcast.to(roomId).emit("room_join", userId);
  });
});

app.all("*", (req, res) => {
  return handle(req, res);
});

const PORT = process.env.PORT || 443;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

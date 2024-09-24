const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const { ExpressPeerServer } = require("peer");
const { createClient } = require("@supabase/supabase-js");

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

const connectedUsers = {}; // Storing connected users
const peerIds = {}; // Storing peerIds if needed

io.on("connection", (socket) => {
  // Assuming `uid` is passed when the user connects (from Supabase)
  const uid = socket.handshake.query.uid; // Supabase uid
  if (uid) {
    // Store the uid and the socket.id
    connectedUsers[uid] = socket.id;

    console.log(
      `User ${uid} (Supabase UID) connected with socket ID: ${socket.id}`
    );
  }

  // Handle user toggling video
  socket.on("toggle_video", (fromUid, toUid) => {
    console.log(`User ${fromUid} (Supabase UID) has toggled video`);
    // Get the socket id of the target user by their Supabase uid
    let targetSocketId = connectedUsers[toUid];
    if (targetSocketId) {
      // Emit the message to the specific user by their socket id
      socket.to(targetSocketId).emit("toggle_video", fromUid);
    } else {
      console.log(`User ${toUid} (Supabase UID) is not connected.`);
    }
  });

  // Handle user toggling audio
  socket.on("toggle_audio", (fromUid, toUid) => {
    console.log(`User ${fromUid} (Supabase UID) has toggled audio`);
    // Get the socket id of the target user by their Supabase uid
    let targetSocketId = connectedUsers[toUid];
    if (targetSocketId) {
      // Emit the message to the specific user by their socket id
      socket.to(targetSocketId).emit("toggle_audio", fromUid);
    } else {
      console.log(`User ${toUid} (Supabase UID) is not connected.`);
    }
  });

  // Handle sending messages between users based on Supabase uid
  socket.on("send_msg", (fromUid, toUid, message) => {
    console.log(
      `User ${fromUid} (Supabase UID) sent a message to user ${toUid}: ${message}`
    );

    // Get the socket id of the target user by their Supabase uid
    let targetSocketId = connectedUsers[toUid];

    if (targetSocketId) {
      // Emit the message to the specific user by their socket id
      socket.to(targetSocketId).emit("receive_msg", {
        from: fromUid,
        message: message,
      });
    } else {
      console.log(`User ${toUid} (Supabase UID) is not connected.`);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    if (uid) {
      console.log(`User ${uid} disconnected.`);
      delete connectedUsers[uid]; // Remove the user from the connected list
      delete peerIds[uid]; // Optionally remove peerId if you want to clear it on disconnect
    }
  });
});

app.all("*", (req, res) => {
  return handle(req, res);
});

const PORT = process.env.PORT || 9000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

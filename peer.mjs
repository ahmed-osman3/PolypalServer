import { PeerServer } from "peer";

const peerServer = PeerServer({ port: 8080, path: "/myapp" });

if (peerServer) {
  console.log("Peerjs server started on port 8080");
}
peerServer.on("connection", (client) => {
  console.log("Client connected:", client.id);
});

peerServer.on("disconnect", (client) => {
  console.log("Client disconnected:", client.id);
});

peerServer.on("error", (err) => {
  console.error("Server error:", err);
});

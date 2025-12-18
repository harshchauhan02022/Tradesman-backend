const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const socket = require("./socket");

dotenv.config({ path: "./config/config.env" });

const server = http.createServer(app);
socket.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

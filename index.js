const { server } = require("./server");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

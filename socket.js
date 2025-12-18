let io = null;
let onlineUsers = {};

module.exports = {
    init: (server) => {
        const { Server } = require("socket.io");

        io = new Server(server, {
            cors: { origin: "*" }
        });

        io.on("connection", (socket) => {
            console.log("🟢 Socket connected:", socket.id);

            socket.on("register", (userId) => {
                onlineUsers[String(userId)] = socket.id;
            });

            socket.on("disconnect", () => {
                for (const id in onlineUsers) {
                    if (onlineUsers[id] === socket.id) {
                        delete onlineUsers[id];
                        break;
                    }
                }
            });
        });
    },

    getIO: () => io,
    getOnlineUsers: () => onlineUsers
};

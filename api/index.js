const app = require("express")();
const http = require("http").createServer(app);
// instancia no servidor
const io = require("socket.io")(http);

let publicMessages = {};
publicMessages.messages = [];
let clients = [];
// CONEXÃO ESTABELECIDA
io.on("connection", (socket) => {
  socket.on("register", (nickname) => {
    socket.nickname = nickname;
    socket.emit("register", nickname);
    socket.join('public');
    clients.push({
      nickname,
      id: socket.id,
      status: 'online',
    });

    io.to('public').emit("clientsList", clients);
    io.to('public').emit("oldMesssages", publicMessages.messages);
  });

  socket.on("message", (msg) => {
    const messageObj = {
      ...msg,
      socketId: socket.id,
    };

    publicMessages.messages.push(messageObj)
    socket.broadcast.to('public').emit("message", messageObj);
  });

  socket.on("userIsTyping", (userIsTyping) => {
    socket.broadcast.emit("userIsTyping", {
      userIsTyping,
      nickname: socket.nickname,
    });
  });

  socket.on("statusChange", (data) => {
    const socketIndex = clients.findIndex((client) => client.id === data.id);
    const foundSocket = clients[socketIndex];
    clients[socketIndex] = {
      ...foundSocket,
      status: data.status,
    };

    io.to('public').emit("clientsList", clients);
  });

  socket.on("disconnect", () => {
    clients = clients.filter((client) => client.nickname != socket.nickname);
    io.to('public').emit('clientsList', clients);
  });
});

const appPort = process.env.PORT || 3000;

http.listen(appPort, () => {
  console.log("listening on" + appPort);
});

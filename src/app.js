const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const xxh = require('xxhashjs');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;


const handler = (req, res) => {
  if (req.url === '/bundle.js') {
    fs.readFile(`${__dirname}/../hosted/bundle.js`, (err, data) => {
      if (err) {
        throw err;
      }
      res.writeHead(200);
      res.end(data);
    });
  } else {
    fs.readFile(`${__dirname}/../hosted/index.html`, (err, data) => {
      if (err) {
        throw err;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
};

const app = http.createServer(handler);
const io = socketio(app);


app.listen(PORT);


io.on('connection', (sock) => {
  const socket = sock;


  socket.join('room1');

  socket.square = {
    hash: xxh.h32(`${socket.id}${Date.now()}`, 0xB105F00D).toString(16),
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    destX: 0,
    destY: 0,
    alpha: 0,
    height: 121,
    width: 61,
    moveLeft: false,
    moveRight: false,
    jump: false,
  };

  socket.emit('joined', socket.square);
  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();
    if (socket.square.destY < 377) {
      socket.square.destY += 5;
    } else {
      socket.square.dest = 377;
    }
    io.sockets.in('room1').emit('updatedMovement', socket.square);
  });


  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.square.hash);
    socket.leave('room1');
  });
});

console.log(`listening on port ${PORT}`);

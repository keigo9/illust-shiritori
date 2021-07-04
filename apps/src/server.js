const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const port = process.env.PORT || 3000;
app.set('port', port);
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    // origin: "http://localhost:3000/",
    origin: "https://desolate-ocean-87379.herokuapp.com/", //heorku
    methods: ["GET", "POST"]
  }
});

app.use(express.static('src'));
app.use(bodyParser());

const posts = {};

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.post('/posts/create', (req, res) => {
  const id = randomBytes(4).toString('hex');
  const title = req.body.shiritori;
  posts[id] = {
    id,
    title
  }
  console.log(posts[id]);

  res.status(201).send(posts);
});

io.sockets.on('connection', function (socket) {
  console.log('coneccted.')

  // クライアントからメッセージ受信
  socket.on('clear send', function () {
    // 自分以外の全員に送る
    socket.broadcast.emit('clear user');
  });

  socket.on('prev send', function () {
    socket.broadcast.emit('prev user');
  });

  socket.on('next send', function () {
    socket.broadcast.emit('next user');
  });

  socket.on('mousedown send', function (msg) {
    socket.broadcast.emit('mousedown user', msg);
  });

  socket.on('sendImagePicture send', function () {
    socket.broadcast.emit('sendImagePicture user');
  });

  socket.on('sendImageTitle send', function (msg) {
    socket.broadcast.emit('sendImageTitle user', msg);
  });

  socket.on('sendRenderImageTitle send', function () {
    socket.broadcast.emit('sendRenderImageTitle user');
  });

  socket.on('startString send', function (msg) {
    socket.broadcast.emit('startString user', msg);
  });

  socket.on('server send', function (msg) {
    socket.broadcast.emit('send user', msg);
  });

  // 切断
  socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
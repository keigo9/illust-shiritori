const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "https://shiritori.dev/",
    methods: ["GET", "POST"]
  }
});
const port = 3000;

app.use(express.static('src'));
app.use(bodyParser());

const posts = {};

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.post('/posts/create', (req, res) => {
  const id = randomBytes(4).toString('hex');
  // console.log(req.body.shiritori);
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
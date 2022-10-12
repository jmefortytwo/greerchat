const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 10000;

var ids = [];
var handles = [];
var anonc = 0;
var id;
var whandle;
var tg;

app.get('/', (req, res) => {
  res.sendFile('/index.html', {root: __dirname});
});

io.on('connection', (socket) => {
  ids.push(socket.id);
  console.log('gave userid: '+socket.id);
  socket.on('connection', () => {
    res.sendFile();
  });
  socket.on('disconnect', () => {
    io.emit('chat message', 'server: '+handles[ids.indexOf(socket.id)]+' has left!');
    handles.splice(ids.indexOf(socket.id), 1);
    console.log('removed userid: '+socket.id);
    ids.splice(ids.indexOf(socket.id), 1);
  });
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
  socket.on('handle', handle => {
    handle = handle.replace(/[^a-z0-9]/gi, '');
    if(handle != ''&&handle.indexOf('whisper')==-1&&handle.indexOf('server')==-1) {
    if(handles.indexOf(handle)==-1) {
        handles.push(handle);
        console.log('gave handle: '+handle);
        io.emit('chat message', handle+' has joined!');
      } else {
        io.to(socket.id).emit('handle');
      }
    } else {
      io.to(socket.id).emit('anonymous', 'anonymous'+anonc);
      anonc++;
    }
  });
  socket.on('gethandles', () => {
    io.to(socket.id).emit('chat message', '(whisper from server): currently connected: '+handles);
  });
  socket.on('target', target => {
    tg = target;
    if(handles.indexOf(tg)!=-1) {
      id = ids[handles.indexOf(tg)];
    } else {
      id = 'not found';
    }
  });
  socket.on('whandle', handle => {
    whandle = handle;
  });
  socket.on('whisper', msg => {
    if(id!='not found') {
      socket.to(id).emit('chat message', '(whisper from '+whandle+'): '+msg);
      io.to(socket.id).emit('chat message', '(whisper to '+tg+'): '+msg);
    } else {
      io.to(socket.id).emit('chat message', '(whisper from server): user not found!');
    }
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

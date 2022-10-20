const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 10000;

var ids = [];
var handles = [];
var crooms = [];
var rooms = ['main'];
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
  if(rooms.indexOf('main')<0) {
    rooms.push('main');
  }
  socket.join('main');
  crooms.push('main');
  socket.on('connection', () => {
    res.sendFile();
  });
  socket.on('disconnect', () => {
    io.to(crooms[ids.indexOf(socket.id)]).emit('chat message', handles[ids.indexOf(socket.id)]+' has left room '+crooms[ids.indexOf(socket.id)]+'');
    crooms.splice(ids.indexOf(socket.id), 1);
    io.emit('chat message', handles[ids.indexOf(socket.id)]+' has disconnected.');
    handles.splice(ids.indexOf(socket.id), 1);
    console.log('removed userid: '+socket.id);
    ids.splice(ids.indexOf(socket.id), 1);
  });
  socket.on('chat message', msg => {
    console.log(msg+' in room '+crooms[ids.indexOf(socket.id)]);
    io.to(crooms[ids.indexOf(socket.id)]).emit('chat message', msg);
  });
  socket.on('handle', handle => {
    handle = handle.replace(/[^a-z0-9]/gi, '');
    if(handle != ''&&handle.indexOf('whisper')==-1&&handle.indexOf('server')==-1) {
    if(handles.indexOf(handle)==-1) {
        handles.push(handle);
        io.to(socket.id).emit('h', handle);
        console.log('gave handle: '+handle);
        io.emit('chat message', handle+' has connected!');
        io.to('main').emit('chat message', handle+' has joined room main!');
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
  socket.on('createroom', name => {
    var roomExists = false;
    for(i=0;i<rooms.length;i++) {
      if(name==rooms[i]) {
        roomExists = true;
      }
    }
    console.log(roomExists);
    if(roomExists === false) {
      rooms.push(name);
      io.to(crooms[ids.indexOf(socket.id)]).emit('chat message', handles[ids.indexOf(socket.id)]+' has left room '+crooms[ids.indexOf(socket.id)]+'.')
      socket.join(name);
      socket.leave(crooms[ids.indexOf(socket.id)]);
      crooms.splice(ids.indexOf(socket.id), 1, name);
      io.to(name).emit('chat message', handles[ids.indexOf(socket.id)]+' has joined room '+name+'!');
    } else {
      io.to(socket.id).emit('chat message','(whisper from server): room already exists!');
    }
  });
  socket.on('join', name => {
    var roomExists = false;
    for(i=0;i<rooms.length;i++) {
      if(rooms[i]==name) {
        roomExists = true;
      }
    }
    if(roomExists === true) {
      io.to(crooms[ids.indexOf(socket.id)]).emit('chat message', handles[ids.indexOf(socket.id)]+' has left room '+crooms[ids.indexOf(socket.id)]+'.')
      socket.join(name);
      socket.leave(crooms[ids.indexOf(socket.id)]);
      if(io.sockets.adapter.rooms.get(crooms[ids.indexOf(socket.id)]).size==0) {
        rooms.splice(rooms.indexOf(crooms[ids.indexOf(socket.id)]));
      }
      crooms.splice(ids.indexOf(socket.id), 1, name);
      io.to(name).emit('chat message', handles[ids.indexOf(socket.id)]+' has joined room '+name+'!');
    } else {
      io.to(socket.id).emit('chat message', '(whisper from server): room does not exist!');
    }
  });

  socket.on('help', afs => {
    afs.replaceAll('/', '');
    if(afs == 'whisper') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: send a private message to another user, even if they are in a different room. usage: /whisper <target> <message>');
    } else if(afs == 'users') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: list all users. usage: /users');
    } else if(afs == 'create') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: create a room. usage: /create <room name>');
    } else if(afs == 'join') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: join a room. usage: /join <room name>');
    } else if(afs == 'disconnect') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: disconnects you from server. usage: /disconnect');
    } else if(afs == 'help') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: list commands or get command usage. usage: /help <command>');
    } else if(afs == 'room') {
      io.to(socket.id).emit('chat message', '(whisper from server): purpose: list users in room. usage: /room');
    } else {
      io.to(socket.id).emit('chat message', '(whisper from server): commands: /help, /whisper, /create, /join, /disconnect');
    }
  });

  socket.on('room', () => {
    var lst = [];
    for(i = 0;i < handles.length;i++) {
      if(crooms[i]==crooms[ids.indexOf(socket.id)]) {
        lst[lst.length] = handles[i];
      }
    }
    io.to(socket.id).emit('chat message', '(whisper from server): users in room: '+lst);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , hat = require('hat')
  ;

var app = express();
var server = http.createServer(app);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.set('log level', 1);

var users = [];
var colors = {};
io.sockets.on('connection', function (socket) {
  socket.name = hat(32);
  socket.emit('init', {id: socket.name, users: users, colors: colors});
  users.unshift(socket.name);
	socket.on('online', function (data) {  
    colors[data.id] = data.color;
    socket.broadcast.emit('newcomer', data);
  });
  
  socket.on('mousemove', function (data) {
		socket.broadcast.emit('moving', data);
	});
	socket.on('disconnect', function () {
    var idx = users.indexOf(socket.name);
    var id = socket.name;
    if(-1 != idx){
      delete colors[users[idx]];
      users.splice(idx,1);
    }
    socket.broadcast.emit('offline', {id: id});
	});
  socket.on('speak', function (data) {
    io.sockets.emit('speaking', data);
  })
});

var palette = [
'#7C7C7C','#0000FC','#0000BC','#4428BC','#940084','#A80020','#A81000','#881400','#503000','#007800','#006800','#005800',
'#004058','#0078F8','#0058F8','#6844FC','#D800CC','#E40058','#F83800','#E45C10','#AC7C00','#00B800','#00A800','#00A844',
'#008888','#3CBCFC','#6888FC','#9878F8','#F878F8','#F85898','#F87858','#FCA044','#F8B800','#B8F818','#58D854','#58F898',
'#00E8D8','#787878','#FCFCFC','#A4E4FC','#B8B8F8','#D8B8F8','#F8B8F8','#F8A4C0','#F0D0B0','#FCE0A8','#F8D878','#D8F878',
'#B8F8B8','#B8F8D8','#00FCFC','#F8D8F8'
];

$(function(){

    // This demo depends on the canvas element
    if(!('getContext' in document.createElement('canvas'))){
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }

    // The URL of your web server (the port is set in app.js)
    var url = 'http://localhost:3000';
    var outerbox = $("#outerbox");
    var userlist = $("table#userlist");
    userlist.width()
    var doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d');

    var my = {
        id: '',
        color: '',
        icon: ''
    };
    // A flag for drawing activity
    var drawing = false;

    var clients = {};
    var cursors = {};

    var socket = io.connect(url);

    socket.on('init', function (data) {
        my.id = data.id;
        my.color = (Math.random()*palette.length)|0;
        for(var i in data.users){
            var id = data.users[i];
            clients[id] = {color: data.colors[id]};
            cursors[id] = $('<div class="cursor">').appendTo('#cursors');
            $('<tr id="'+id+'"><td>'+id+'</td></tr>').prependTo('#userlist');
        }
        socket.emit('online', {id: my.id, color: my.color});
    });
    socket.on('newcomer', function (data) {
        clients[data.id] = {color: data.color};
        cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        $('<tr id="'+data.id+'"><td>'+data.id+'</td></tr>').prependTo('#userlist');
    });
    socket.on('offline', function (data) {
        cursors[data.id].remove();
        $('#'+data.id).remove();
        delete clients[data.id];
        delete cursors[data.id];
    });

    socket.on('moving', function (data) {
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // Is the user drawing?
        if(data.drawing && (typeof clients[data.id].x != "undefined")){

            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, palette[data.color]);
        }

        // Saving the current client state
        clients[data.id].x = data.x;
        clients[data.id].y = data.y;
    });

    var prev = {};

    canvas.on('mousedown',function(e){
        e.preventDefault();
        drawing = true;
        prev.x = e.pageX;
        prev.y = e.pageY;

        // Hide the instructions
        $('#instructions').fadeOut();
    });

    doc.bind('mouseup mouseleave',function(){
        drawing = false;
    });

    var lastEmit = $.now();

    doc.on('mousemove',function(e){
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'x': e.pageX,
                'y': e.pageY,
                'drawing': drawing,
                'id': my.id,
                'color': my.color
            });
            lastEmit = $.now();
        }

        // Draw a line for the current user's movement, as it is
        // not received in the socket.on('moving') event above

        if(drawing){

            drawLine(prev.x, prev.y, e.pageX, e.pageY, palette[my.color]);

            prev.x = e.pageX;
            prev.y = e.pageY;
        }
    });

    function drawLine(fromx, fromy, tox, toy, _color){
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.strokeStyle = _color;
        ctx.stroke();
        ctx.closePath();
    }

});
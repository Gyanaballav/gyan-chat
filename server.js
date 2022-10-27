const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomusers} = require('./utils/users');
const app = express();      
//create the server
const server = http.createServer(app);
const io = socketio(server);
//set the static path
app.use(express.static(path.join(__dirname,'public')));

const botname = 'chatbot';
io.on('connection',socket => {

socket.on('joinRoom',({username,room})=>{
const user = userJoin(socket.id,username,room);
socket.join(user.room);


    //single client
socket.emit('message',formatMessage(botname,`welcome to chatbox`))


//Broadcast when auser connnects except the connecting client
socket.broadcast.to(user.room).emit('message',formatMessage(botname,`${user.username} has joined the chat`));

//send user and room data
io.to(user.room).emit('roomUsers',{
    room: user.room,
    users: getRoomusers(user.room)
})
    
});



//Listen for chat message 
socket.on('chatMessage',msg=>{
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message',formatMessage(user.username,msg));
});

//Runs when client disconnects
socket.on('disconnect',()=>{
    const user = userLeave(socket.id);

    if(user){
        io.to(user.room).emit('message',formatMessage(botname,`${user.username} has left the chat`));
        //send the user and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomusers(user.room)
        })
    }
    
})
});


const PORT = 3000 || process.env.PORT;
server.listen(PORT,() => console.log(`server running on port ${PORT}`));
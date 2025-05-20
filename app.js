const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const path = require('path');


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.static(path.join(__dirname, 'public')));




io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('user-join', (username) => {
        socket.username = username;
        io.emit('user-joined', username);
        
    
        Message.find().sort({ timestamp: 1 }).then(messages => {
            socket.emit('previous-messages', messages);
        });
    });

    socket.on('send-message', async (message) => {
        const newMessage = new Message({
            username: socket.username,
            message: message
        });
        
        await newMessage.save();
        io.emit('new-message', {
            username: socket.username,
            message: message,
            timestamp: newMessage.timestamp
        });
    });


    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user-left', socket.username);
        }
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
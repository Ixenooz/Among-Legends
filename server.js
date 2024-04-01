const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const lobbies = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('New user connected');

    // Function to broadcast lobby names to all connected clients
    function broadcastLobbyNames() {
        io.emit('lobbyNames', Object.keys(lobbies));
    }

    // Function to create lobby HTML page
    function createLobbyPage(lobbyName) {
        const pageContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${lobbyName} Lobby</title>
            </head>
            <body>
                <h1>Welcome to ${lobbyName} Lobby!</h1>
                <h2>Users in this lobby:</h2>
                <ul id="lobbyUsers"></ul>
            </body>
            </html>
        `;
        const filePath = path.join(__dirname, 'public', `${lobbyName}.html`);
        fs.writeFileSync(filePath, pageContent);
    }

    // Handle create lobby request
    socket.on('createLobby', ({ username }) => {
        const lobbyName = uuidv4(); // Generate a random lobby name
        lobbies[lobbyName] = { users: [socket.id] };
        socket.join(lobbyName);
        console.log(`Lobby "${lobbyName}" created by user ${username}`);
        broadcastLobbyNames();
        createLobbyPage(lobbyName);
        const lobbyPageUrl = `${lobbyName}.html`;
        socket.emit('redirect', { url: lobbyPageUrl });
    });

    // Handle join lobby request
    socket.on('joinLobby', ({ username, lobbyName }) => {
        if (lobbies[lobbyName]) {
            lobbies[lobbyName].users.push(socket.id);
            socket.join(lobbyName);
            console.log(`User ${username} joined existing lobby "${lobbyName}"`);
            const lobbyPageUrl = `${lobbyName}.html`;
            socket.emit('redirect', { url: lobbyPageUrl });
        } else {
            console.log(`Lobby "${lobbyName}" does not exist`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // Broadcast lobby names to the newly connected client
    broadcastLobbyNames();
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get("/", function(req, res){
    res.sendFile(__dirname + '/index.html') // Retourne l'index.html lorsque je suis connecté à la racine
})
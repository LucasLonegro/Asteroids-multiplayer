import {Game} from "./game.js";
import express from "express";
import * as http from "http";
import {Server} from "socket.io";

import * as url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const FPS_CAP = 60;
const width = 1920;
const height = 1080;

//const express = require('express') // npm instalado
const backend = express()

// socket.io setup
//const http = require('http') // viene con node
const server = http.createServer(backend)
// const {Server} = require('socket.io') // npm instalado
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000})

const port = 3000 // probably gotta change this

backend.use(express.static(__dirname + '/public'))

backend.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

const backendPlayers = {}
const movements = [];
let game = new Game(FPS_CAP, width, height, movements);

function getPointCollections(itemCollections) {
    let pointCollections = [];
    itemCollections.forEach(iC => iC.forEach(item => {
        let pc = item.getPointCollection()
        if (pc !== undefined)
            pointCollections.push(pc)
    }));
    return pointCollections;
}

const maxUsernameLength = 20;
io.on('connection', (socket) => {
    console.log('A user has connected')
    backendPlayers[socket.id] = {
        id: socket.id
    }

    movements[socket.id] =
        {
            turn: 0,
            fire: false,
            thrust: false,
        }


    io.emit('updatePlayers', getPointCollections(game.allItems))

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete backendPlayers[socket.id]
        game.removeSpaceship(socket.id)
        io.emit('updatePlayers', backendPlayers)
    })

    socket.on('initGame', (name) => {
        game.addSpaceship(socket.id)
        if (name instanceof String || typeof name === 'string') {
            game.setShipName(socket.id, name.slice(0, maxUsernameLength));
        }
    })

    socket.on('keyup', (key) => {
        if (key.toLowerCase() === 'w')
            movements[socket.id].thrust = false;
        else if (key === ' ' || key === 'Shift')
            movements[socket.id].fire = false;
        else if ((key.toLowerCase() === 'd' && movements[socket.id].turn !== 1) || (key.toLowerCase() === 'a' && movements[socket.id].turn !== -1))
            movements[socket.id].turn = 0;
    })
    socket.on('keydown', (key) => {
        if (key.toLowerCase() === 'w')
            movements[socket.id].thrust = true;
        else if (key === ' ' || key === 'Shift')
            movements[socket.id].fire = true;
        else if (key.toLowerCase() === 'd')
            movements[socket.id].turn = -1;
        else if (key.toLowerCase() === 'a')
            movements[socket.id].turn = 1;
    })

    console.log(backendPlayers)
})


server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

setInterval(() => {
    game.update()
    io.emit('updatePlayers', getPointCollections(game.allItems))
}, 15)

console.log('Loaded')
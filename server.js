const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: "uploads/" });

let users = [];
let filesDB = {};

app.post("/register", (req, res) => {

    const { username, password } = req.body;

    const exist = users.find(u => u.username === username);

    if (exist) {
        return res.json({
            success: false,
            message: "Utilisateur existe déjà"
        });
    }

    users.push({
        username,
        password
    });

    res.json({
        success: true
    });
});

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) {

        return res.json({
            success: false,
            message: "Identifiants incorrects"
        });
    }

    res.json({
        success: true,
        username
    });
});

app.post("/upload", upload.single("file"), (req, res) => {

    const file = req.file;

    const fakeHash = file.originalname + "_" + file.size;

    if (!filesDB[fakeHash]) {

        filesDB[fakeHash] = {
            firstUploader: req.body.username
        };
    }

    // Return a URL so clients can access the uploaded file
    const fileUrl = `/uploads/${file.filename}`;

    res.json({
        success: true,
        fileName: file.originalname,
        fileUrl,
        firstUploader: filesDB[fakeHash].firstUploader
    });
});

io.on("connection", (socket) => {

    socket.on("join", (username) => {

        socket.username = username;

        io.emit("system", `${username} est connecté`);
    });

    socket.on("chat message", (data) => {

        io.emit("chat message", data);
    });

    socket.on("disconnect", () => {

        if (socket.username) {

            io.emit("system", `${socket.username} s'est déconnecté`);
        }
    });
});

server.listen(3000, () => {

    console.log("Serveur lancé sur http://localhost:3000");
});
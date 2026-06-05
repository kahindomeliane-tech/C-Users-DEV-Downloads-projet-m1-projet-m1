const socket = io();

const username = localStorage.getItem("username");

if(!username){

    window.location = "login.html";
}

// Display username in header
document.getElementById("userDisplay").textContent = `Connecté: ${username}`;

socket.emit("join", username);

const messages = document.getElementById("messages");

function addMessage(html, className="message"){

    const div = document.createElement("div");

    div.classList.add(className);

    div.innerHTML = html;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}

function sendMessage(){

    const input = document.getElementById("messageInput");

    const message = input.value;

    socket.emit("chat message", {
        username,
        message
    });

    input.value = "";
}

socket.on("chat message", (data)=>{

    addMessage(`
        <strong>${data.username}</strong><br>
        ${data.message}
    `);
});

socket.on("system", (msg)=>{

    addMessage(msg, "system");
});

async function uploadFile(){

    const file = document.getElementById("fileInput").files[0];

    const formData = new FormData();

    formData.append("file", file);

    formData.append("username", username);

    const response = await fetch("/upload", {

        method:"POST",

        body:formData
    });

    const result = await response.json();

    socket.emit("chat message", {

        username,

        message:`
        📁 ${result.fileName}<br>
        🏆 Premier partage : ${result.firstUploader}
        `
    });
}

function logout(){

    localStorage.removeItem("username");

    window.location = "login.html";
}
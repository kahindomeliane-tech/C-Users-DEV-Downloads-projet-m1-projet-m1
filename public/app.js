const socket = io();

const username = localStorage.getItem("username");

if(!username){

    window.location = "login.html";
}

// Display username in header
const userDisplay = document.getElementById("userDisplay");
if (userDisplay) {
    userDisplay.textContent = `Connecté: ${username}`;
}

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

    if(!message) return; // don't send empty messages

    socket.emit("chat message", {
        username,
        message
    });

    input.value = "";
}

socket.on("chat message", (data)=>{

    // If message contains a fileUrl, render a file preview/link
    if (data.fileUrl) {
        const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(data.fileName || data.fileUrl);
        const firstUploader = data.firstUploader ? `<div class="file-uploader">Premier partage par : <strong>${data.firstUploader}</strong></div>` : '';
        if (isImage) {
            addMessage(`
                <strong>${data.username}</strong><br>
                <div class="file-message"><img src="${data.fileUrl}" alt="${data.fileName}" /></div>
                <div class="file-name">${data.fileName}</div>
                ${firstUploader}
            `);
        } else {
            addMessage(`
                <strong>${data.username}</strong><br>
                <a href="${data.fileUrl}" target="_blank" rel="noopener noreferrer">📁 ${data.fileName}</a>
                ${firstUploader}
            `);
        }
        return;
    }

    addMessage(`
        <strong>${data.username}</strong><br>
        ${data.message}
    `);
});

socket.on("system", (msg)=>{

    addMessage(msg, "system");
});

async function uploadFile(){
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if(!file) return alert('Aucun fichier sélectionné');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", username);

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const result = await response.json();

    if(!result.success) return alert('Erreur upload');

    // Emit file message with fileUrl so clients can render preview/link
    socket.emit("chat message", {
        username,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        firstUploader: result.firstUploader
    });

    // clear preview and input
    document.getElementById('preview').innerHTML = '';
    fileInput.value = '';
}

// Preview selected file before uploading
const fileInputEl = document.getElementById('fileInput');
if (fileInputEl) {
    fileInputEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('preview');
        if(!preview) return;
        preview.innerHTML = '';
        if (!file) return;
        const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
        if (isImage) {
            const img = document.createElement('img');
            img.style.maxWidth = '160px';
            img.style.maxHeight = '120px';
            img.style.borderRadius = '8px';
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else {
            const p = document.createElement('div');
            p.textContent = `Fichier prêt: ${file.name}`;
            preview.appendChild(p);
        }
    });
}

// send on Enter
const msgInput = document.getElementById('messageInput');
if (msgInput) {
    msgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

function logout(){

    localStorage.removeItem("username");

    window.location = "login.html";
}
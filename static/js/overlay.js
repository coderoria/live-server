const socket = io("http://localhost:3000");

socket.on("chat", (userstate, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if(alertBox == undefined) return;
    window[alertBox.dataset.function](userstate["username"], "follow", message);
});
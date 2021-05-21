const socket = io("http://localhost:3000");

socket.on("follow", (userstate, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if(alertBox == undefined) return;
    window[alertBox.dataset.function](userstate["username"], "follow", message);
});

socket.on("sub", (userstate, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if(alertBox == undefined) return;
    window[alertBox.dataset.function](userstate["username"], "sub", message);
});
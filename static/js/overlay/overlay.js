const socket = io("http://localhost:3000");

socket.on("follow", (name, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](name, "follow", message);
});

socket.on("sub", (name, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](name, "sub", message);
});

socket.on("cheer", (name, message) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](name, "bit", message);
});

socket.on("playback", (img, artists, title) => {
    let playBackBox = document.querySelector(".playback-box");
    if (playBackBox == undefined) return;
    window[playBackBox.dataset.function](img, artists, title);
});

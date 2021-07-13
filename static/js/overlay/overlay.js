const socket = io();

socket.on("channel.follow", (event) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](
        chooseSanitized(event.user_name, event.user_login),
        "follow"
    );
});

socket.on("channel.subscribe", (event) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](
        chooseSanitized(event.user_name, event.user_login),
        "sub"
    );
});

socket.on("channel.subscription.message", (event) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return;
    window[alertBox.dataset.function](
        chooseSanitized(event.user_name, event.user_login),
        "sub",
        event.message
    );
});

socket.on("playback", (img, artists, title) => {
    let playBackBox = document.querySelector(".playback-box");
    if (playBackBox == undefined) return;
    window[playBackBox.dataset.function](img, artists, title);
});

function chooseSanitized(displayName, userName) {
    return displayName.toLowerCase() === userName ? displayName : userName;
}

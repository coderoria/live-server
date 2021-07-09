var io = io();

$(document).ready(() => {
    $('#spotify-form input').on("click", (event) => {
        event.preventDefault();
        console.log(event);
        let user = event.target.value;
        $("#spotify-form .spinner-border").show();

        io.emit("spotify.user", user);
    });
});

io.on("spotify.user", user => {
    let radio = $("#spotify-user-" + user);
    $("#spotify-form input").prop("checked", false);
    radio.prop("checked", true);
    $("#spotify-form .spinner-border").hide();
});

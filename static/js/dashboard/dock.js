var io = io();

$(document).ready(() => {
    $('#spotify-form input').on("click", (event) => {
        event.preventDefault();
        let user = $('input:checked', "#spotify-form").val();
        $("#spotify-form .spinner-border").show();

        io.emit("spotify.user", user);
    });
});

io.on("spotify.user", user => {
    let radio = $("#spotify-user-" + user);
    radio.prop("checked", true);
    $("#spotify-form .spinner-border").hide();
});

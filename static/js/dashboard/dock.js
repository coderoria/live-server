var io = io();

$(document).ready(() => {
    $('#spotify-form input').on("change", () => {
        let user = $('input:checked', "#spotify-form").val();
        io.emit("spotify.user", user, success => {
    
        });
    });
});
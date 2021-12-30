var io = io();

/**
 * Spotify form
 */
$(document).ready(() => {
    $("#spotify-form input").on("click", (event) => {
        event.preventDefault();
        console.log(event);
        let user = event.target.value;
        $("#spotify-form .spinner-border").show();

        io.emit("spotify.user", user);
    });
});

io.on("spotify.user", (user) => {
    let radio = $("#spotify-user-" + user);
    $("#spotify-form input").prop("checked", false);
    radio.prop("checked", true);
    $("#spotify-form .spinner-border").hide();
});

/**
 * Pretzel form
 */
$(document).ready(() => {
    $("#pretzel-form input").on("click", (event) => {
        event.preventDefault();
        console.log(event);
        let user = event.target.value;
        $("#pretzel-form .spinner-border").show();

        io.emit("pretzel.user", user);
    });
});

io.on("pretzel.user", (user) => {
    let radio = $("#pretzel-user-" + user);
    $("#pretzel-form input").prop("checked", false);
    radio.prop("checked", true);
    $("#pretzel-form .spinner-border").hide();
});

io.on("channel.follow", (event) => {
    $("#events").prepend(
        `<div class="fade list-group-item list-group-item-secondary">` +
            `<div class="d-flex"><h6>Follow</h6><span class="ms-auto">${moment(
                event.followed_at
            ).format("DD.MM. HH:mm")}</span></div>
            <span>${chooseSanitized(
                event.user_name,
                event.user_login
            )}</span></div>`
    );
    setTimeout(() => {
        $("#events div").first().addClass("show");
    }, 500);
});

function chooseSanitized(displayName, userName) {
    return displayName.toLowerCase() === userName ? displayName : userName;
}

let alert_queue = [];
const ALERT_DELAY = 2000;

function addAlert(name, action, message) {
    alert_queue.push({ name: name, action: action, message: message });
    if (alert_queue.length == 1) {
        showAlertBox(name, action, message);
    }
}

function showAlertBox(name, action, message) {
    let messageDelay = message == undefined ? 0 : message.length * 50;
    figlet(name, function (err, data) {
        if (err) {
            console.log("Something went wrong...");
            console.dir(err);
            return;
        }
        document.querySelector(".alert-box-icon").src =
            "/static/img/" + action + ".svg";
        document.querySelector(".alert-box-message").innerHTML =
            message != undefined ? message : "";
        let alertBoxUser = document.querySelector(".alert-box-user");
        alertBoxUser.innerHTML = data;

        let audio = new Audio("/static/follow.mp3");
        audio.play();

        anime({
            targets: ".alert-box",
            top: "10%",
            duration: 1000,
            endDelay: messageDelay > ALERT_DELAY ? messageDelay : ALERT_DELAY,
            complete: next,
            direction: "alternate",
        });
    });
}

function next() {
    alert_queue.shift();
    if (alert_queue.length == 0) return;

    let alert = alert_queue[0];
    showAlertBox(alert.name, alert.action, alert.message);
}

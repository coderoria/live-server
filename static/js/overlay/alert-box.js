let alert_queue = [];
const ALERT_DELAY = 2000;
const socket = io();

function addAlert(name, action, details = {}) {
  name = name.replace(/(.)(\1{5,})(\1)/gm, "$1...$3");
  alert_queue.push({ name: name, action: action, details: details });
  if (alert_queue.length == 1) {
    showAlertBox(name, action, details);
  }
}

function showAlertBox(name, action, details) {
  let messageDelay =
    details.message == undefined ? 0 : details.message.length * 50;
  figlet(name, function (err, data) {
    if (err) {
      logger.log("Something went wrong...");
      logger.dir(err);
      return;
    }
    document.querySelector(".alert-box-icon").src =
      "/static/img/" + action + ".svg";
    document.querySelector(".alert-box-message").innerHTML =
      details.message != undefined ? details.message : "";
    let alertBoxUser = document.querySelector(".alert-box-user");
    alertBoxUser.innerHTML = data;

    let audio = new Audio("/static/follow.mp3");
    audio.play();

    anime({
      targets: ".alert-box",
      top: "10%",
      duration: 1000,
      endDelay:
        messageDelay > ALERT_DELAY
          ? messageDelay
          : ALERT_DELAY / Math.sqrt(alert_queue.length),
      complete: next,
      direction: "alternate",
    });
  });
}

function next() {
  alert_queue.shift();
  if (alert_queue.length == 0) return;

  let alert = alert_queue[0];
  showAlertBox(alert.name, alert.action, alert.details);
}

socket.on("channel.follow", (event) => {
  addAlert(chooseSanitized(event.user_name, event.user_login), "follow");
});

socket.on("channel.subscribe", (event) => {
  addAlert(chooseSanitized(event.user_name, event.user_login), "sub");
});

socket.on("channel.subscription.message", (event) => {
  addAlert(chooseSanitized(event.user_name, event.user_login), "sub", {
    message: event.message.text,
    cumulative_months: event.cumulative_months,
    duration_months: event.duration_months,
  });
});

function chooseSanitized(displayName, userName) {
  return displayName.toLowerCase() === userName ? displayName : userName;
}

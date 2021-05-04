function showAlertBox(name, action, message) {
    figlet(name, function (err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        document.querySelector(".alert-box-icon").src = "/static/img/"+action+".svg";
        document.querySelector(".alert-box-message").innerHTML = message != undefined ? message : "";
        let alertBoxUser = document.querySelector(".alert-box-user");
        alertBoxUser.innerHTML = data;
        anime({
            targets: ".alert-box",
            top: "10%",
            duration: 1000,
            endDelay: 2000,
            direction: "alternate"
        });
    });
}
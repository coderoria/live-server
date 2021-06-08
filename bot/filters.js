function checkCaps(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /[A-Z]/g;
    let caps = (message.match(re) || []).length;
    if (caps / message.length > 0.8) {
        return true;
    } return false;
}

function checkSpamLetters(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /%CC%/g;
    if (message.match(re).length != 0) {
        return true;
    } return false;
}

function checkLinks(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    let matches = re.exec(message);
    if (matches == null) {
        return false;
    }
    
    if(matches[1] === "clips.twitch.tv") {

    }
}
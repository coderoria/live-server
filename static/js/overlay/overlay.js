window.onerror = (event) => {
    socket.emit("error", {
        error: event,
        url: window.location.href,
        agent: navigator.userAgent,
        socket: socket.id,
    });
};

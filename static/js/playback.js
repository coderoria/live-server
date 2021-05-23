function showPlayBack(img, artists, title) {
    document.querySelector(".playback-image").src = img;
    document.querySelector(".playback-title").innerHTML = title;
    document.querySelector(".playback-artists").innerHTML = artists;
    let titleAnim;
    if(title.length > 27) {
        titleAnim = document.querySelector(".playback-title").animate([
            {transform: 'translateX(100%)'},
            {transform: 'translateX(-150%)'}
        ], {
            duration: 9000,
            iterations: Infinity
        });
    }
    anime({
        targets: ".playback-box",
        bottom: "0px",
        duration: 1000,
        endDelay: 7000,
        direction: "alternate",
        complete: () => {
            if(titleAnim != undefined) titleAnim.cancel();
        },
        easing: 'cubicBezier(0.000, 0.000, 0.580, 1.000)'
    });
}
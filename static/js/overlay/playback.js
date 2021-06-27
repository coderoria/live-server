function showPlayBack(img, artists, title) {
    document.querySelector(".playback-image").src = img;
    let titleElement = document.querySelector(".playback-title");
    titleElement.innerHTML = title;

    let artistsElement = document.querySelector(".playback-artists");
    artistsElement.innerHTML = artists;

    let titleAnim, artistsAnim;
    if (title.length > 26) {
        titleAnim = titleElement.animate(
            [
                { transform: `translateX(${titleElement.clientWidth}px)` },
                { transform: `translateX(-${titleElement.scrollWidth}px)` },
            ],
            {
                duration: 9000,
                iterations: Infinity,
            }
        );
    }
    if (artists.length > 30) {
        artistsAnim = artistsElement.animate(
            [
                { transform: `translateX(${artistsElement.clientWidth}px)` },
                { transform: `translateX(-${artistsElement.scrollWidth}px)` },
            ],
            {
                duration: 9000,
                iterations: Infinity,
            }
        );
    }
    anime({
        targets: ".playback-box",
        bottom: "0px",
        duration: 500,
        endDelay: 7000,
        direction: "alternate",
        complete: () => {
            if (titleAnim != undefined) titleAnim.cancel();
            if (artistsAnim != undefined) artistsAnim.cancel();
        },
        easing: "cubicBezier(0.000, 0.000, 0.580, 1.000)",
    });
}

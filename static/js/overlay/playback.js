let running = false;
const socket = io();

function showPlayBack(img, artists, title) {
    let imageElement = document.querySelector(".playback-image");
    imageElement.src = img;
    imageElement.onload = () => {
        let titleElement = document.querySelector(".playback-title");
        titleElement.innerHTML = title;

        let artistsElement = document.querySelector(".playback-artists");
        artistsElement.innerHTML = artists;

        if (running) {
            return;
        }
        running = true;

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
        if (artists.length > 29) {
            artistsAnim = artistsElement.animate(
                [
                    {
                        transform: `translateX(${artistsElement.clientWidth}px)`,
                    },
                    {
                        transform: `translateX(-${artistsElement.scrollWidth}px)`,
                    },
                ],
                {
                    duration: 9000,
                    iterations: Infinity,
                }
            );
        }

        let durationElement = document.querySelector(".duration");
        durationElement.animate(
            [
                { transform: `translateX(0px)` },
                { transform: `translateX(-${durationElement.clientWidth}px)` },
            ],
            {
                duration: 15000,
            }
        );

        anime({
            targets: ".playback-box",
            bottom: "0px",
            duration: 500,
            endDelay: 7000,
            direction: "alternate",
            complete: () => {
                if (titleAnim != undefined) titleAnim.cancel();
                if (artistsAnim != undefined) artistsAnim.cancel();
                running = false;
            },
            easing: "cubicBezier(0.000, 0.000, 0.580, 1.000)",
        });
    };
}

socket.on("playback", (img, artists, title) => {
    showPlayBack(img, artists, title);
});

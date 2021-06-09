# Contributing to the live-server project

-   Install the project according to the instructions in the [README](README.md)
-   Instead of running `npm serve`, you can use `npm test` to emulate events after startup (follows, donations, etc)
-   To learn about PUG Templating, see [Pugjs.org](https://pugjs.org)

## Directory Structure

-   bot (bot functions)
-   static (static assets like scripts, styling, ...)
    -   css
    -   fonts
    -   img
    -   js
-   views (PUG web templates)
    -   overlays (base overlay templates)
        -   parts (components of overlays like alertbox)

## Creating new overlay components

1. Create a new pug template in `views/overlays/parts`
1. Include the base overlay template with `extends ../overlay.pug`
1. Use `block content` in the next line to insert new content
1. Create a js and css file in the static directory if needed (`/static/js`, `/static/css`)

```js
extends ../overlay.pug
block content
    link(rel="stylesheet", href="/static/css/alert-box.css")
    script(src="/static/js/alert-box.js")
```

### Notes

-   The base overlay template handles the connection to the server.
-   Your components html element should have an attribute named `data-function` containing the name of the function that should be called whenever an event happens

```js
// alertbox.pug
.alert-box(data-function="addAlert")
```

```js
//alertbox.js
function addAlert(name, action, message) {
    ...
}
```

-   If you want your components function to be called, add it to `/static/js/overlay.js`:

```js
socket.on("follow", (userstate, message, self) => {
    let alertBox = document.querySelector(".alert-box");
    if (alertBox == undefined) return; //the component doesn't have to be loaded!
    window[alertBox.dataset.function](userstate["username"], "follow", message);
});
```

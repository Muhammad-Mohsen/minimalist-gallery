# Tasks
## Phase I
- stream mediastore query to frontend
- DONE - refresh button
- DONE - starting animation
- DONE - fetch failures
- DONE - performance revisited
- thumbnail resolution
- https://developer.android.com/about/versions/14/changes/partial-photo-video-access

- explorer
	- DONE - scroll handle
	- DONE - sort dialog
	- DONE - scroll snapping
	- DONE - empty view
	- DONE - error image to display on load error
	- DONE - search
	- DONE - fix root navigation
	- DONE - thumbnail loading placeholder background-light + image icon
	- DONE - tiff support? - nope
	- DONE - folder subtitle
	- DONE - view transitions
	- DONE - MediaStore!!!
		- DONE - navigation failures: virtual roots + clicking on the crumbs

- image-view
	- DONE - check slop code
	- DONE - display image
	- full-screen toggle?
		- don't think so...just because of the camera hole
	- image carousel + left/right flicks
		- don't think so
	- snap to 90deg within +-10deg
		- don't think so
	- thumbnail carousel scroll-select
		- don't think so

	- toolbars (center aligned)
		- DONE - back
		- share
		- info
			- DONE - name
			- DONE - size / resolution
			- DONE - date
	- DONE - thumbnail carousel
	- DONE - gestures
		- DONE - zooming
		- DONE - rotating
		- DONE - transform origin: gesture mid-point
		- DONE - double-click to reset transforms
		- DONE - click to toggle toolbars

- DONE - view transitions
	- navigation
	- image view
	- image close

- masonry
https://bfgeek.com/flexbox-image-gallery/
```css
.gallery {
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
}

img {
	--ar: attr(width type(<number>)) / attr(height type(<number>));
	width: calc(20% * var(--ar));
	height: auto;
	flex-grow: calc(var(--ar));
}
```

## Phase II
- DONE - edit images (prompt user to save copy, no write permission needed)
- write permission?
	- DONE - delete
	- move
	- copy
	- rename
- grid size options (2, 3, 4 columns)
- grid view options
	- masonry
	- uniform

- use virtual scrolling (at least for the thumbnails because they are slow when translating in and out)

- replace @JavascriptInterface with postMessage
// Restrict to trusted domains for security
val allowedOrigins = setOf("https://androidplatform.net") // or setOf("*")

WebViewCompat.addWebMessageListener(
	webView,
	"nativeBridge", // Object name exposed to JavaScript
	allowedOrigins
) { view, message, sourceOrigin, isMainFrame, replyProxy ->
	// Executed asynchronously when JS sends a message
	val dataFromJs = message.data

	// Process data, then reply back asynchronously if needed
	replyProxy.postMessage("Success from Android!")
}

// Automatically returns a promise/reply mechanism
nativeBridge.postMessage("Hello Native App!");

// To capture the asynchronous response from Android:
nativeBridge.onmessage = function(event) {
	console.log("Received from Android:", event.data);
};

# Tasks
## Phase I
- explorer
	- empty view
		(o^^)o
		\(o_o)/
		(^-^*)
		(≥o≤)
		(˚Δ˚)b
		(='X'=)
		(^_^)b

	- search
	- sort
	- masonry layout
	- DONE - fix root navigation
	- DONE - thumbnail loading placeholder background-light + image icon
	- DONE - tiff support? - nope
	- DONE - folder subtitle

- image-view
	- DONE - check slop code
	- DONE - display image
	- full-screen toggle?
		- don't think so...just because of the camera hole
	- toolbars (center aligned)
		- click to toggle
		- DONE - back
		- share
		- info
			- name
			- path
			- size / resolution
				```javascript
					async function getImageSizeFromUrlRobust(imageUrl) {
						const response = await fetch(imageUrl);
						const blob = await response.blob();
						const sizeInBytes = blob.size;
						const sizeInKB = sizeInBytes / 1000;
						console.log(`Image size: ${sizeInKB.toFixed(2)} KB`);
						return sizeInKB;
					}
				```

				```javascript
					img.onload = function() {
						const originalWidth = img.naturalWidth;
						const originalHeight = img.naturalHeight;
					}
				```
			- date
	- carousel
	- gestures
		- left/right swipes
		- DONE - zooming
		- DONE - rotating
			- snap to 90deg within +-10deg
		- transform origin: gesture mid-point
		- double-click to reset transforms

- view transitions
	- navigation
	- image view
	- image close

## Phase II
- edit images (prompt user to save copy, no write permission needed)
- write permission?
	- delete
	- move
	- copy
	- rename
- grid size options (2, 3, 4 columns)
- grid view options
	- masonry
	- uniform
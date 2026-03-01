# Tasks
## Phase I
- fetch failures
- image carousel + left/right flicks
- performance revisited

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

	- toolbars (center aligned)
		- DONE - back
		- share
		- info
			- DONE - name
			- DONE - size / resolution
			- DONE - date
	- DONE - thumbnail carousel
	- gestures
		- left/right flicks
		- DONE - zooming
		- DONE - rotating
			- snap to 90deg within +-10deg
		- DONE - transform origin: gesture mid-point
		- DONE - double-click to reset transforms
		- DONE - click to toggle toolbars

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


GET https://appassets.androidplatform.net/thumbnail/storage/emulated/0/Pictures/Vehicles/Chevy/Chevrolet%20Corvette%20C8%20GT3R%20(1).jpg net::ERR_CACHE_MISS

GET https://appassets.androidplatform.net/thumbnail/storage/emulated/0/Pictures/Vehicles/Chevy/Chevrolet%20Corvette%20C8%20GT3R%20(2).jpg net::ERR_CACHE_MISS

GET https://appassets.androidplatform.net/thumbnail/storage/emulated/0/Pictures/Vehicles/Chevy/Chevrolet%20Corvette%20C8%20GT3R%20(3).jpg net::ERR_CACHE_MISS
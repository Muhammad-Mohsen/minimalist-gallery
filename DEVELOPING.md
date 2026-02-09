# Tasks
- quick review of code
	- check the flow
		1. app start
		2. permission check
				- denied: show permission UI
				- granted: show explorer (last open dir)
		3. list folders + images (generate thumbnail URIs)
		4. display folders + images (thumbnails)
	- check code structure
		- native
			- files
			- shared prefs (to store current dir)
			- in-memory cache for thumbnails?
			-
- refactor JS code in MY style (html-element-base and whatnot)
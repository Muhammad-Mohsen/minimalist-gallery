// STATE { mode, dir, items, image }
const state = new URLSearchParams(location.search).toMap();

const ipc = new InterProcessCommunication();

if (state.mode == 'permission') {
	document.startViewTransition(() => document.body.innerHTML = '<permission-view></permission-view>');
}
else {
	ipc.dispatch({ type: ipc.Type.LIST_DIR, target: ipc.Target.JS, data: { dir: state.dir } });
}

ipc.subscribe((event) => {
	if (event.target != ipc.Target.NATIVE) return;

	when(event.type)
		.is(ipc.Type.LIST_DIR, () => {
			state.path = event.data.path;
			state.items = event.data.items;

			document.startViewTransition(() => {
				document.body.innerHTML = '<explorer-view></explorer-view>';

				const explorer = document.querySelector('explorer-view');
				explorer.renderItems(state.items);
				explorer.renderCrumbs(state.path);
			});
		})
		.is(ipc.Type.PERMISSION_VIEW, () => {
			if (event.data.mode == 'permission') {
				document.startViewTransition(() => document.body.innerHTML = '<permission-view></permission-view>');
			}
		})
		.is(ipc.Type.BACK, () => {
			// if (todoDialog.isOpen()) return todoDialog.back();
			// else if (labelsDialog.isOpen()) return labelsDialog.saveAndClose();
			// else if (todoList.isMoving()) return todoList.moveItemCancel();

			// return EventBus.dispatch({ type: EventBus.Type.BACK, target: EventBus.Target.JS });
		})
		.otherwise(() => {
			console.log('Unknown event', event);
		});
});


// SLOP

/*
const App = (() => {
	const state = {
		view: 'explorer', // explorer | image
		path: null,
		history: [] // Simple history to support back
	};

	const explorer = document.getElementById('explorer');
	const viewer = document.getElementById('viewer');

	function init() {
		// Subscribe to Native Events
		EventBus.subscribe(handleEvent);

		// Explorer Events
		explorer.addEventListener('navigate', (e) => {
			loadDir(e.detail.path);
		});
		explorer.addEventListener('open', (e) => {
			openImage(e.detail.path, e.detail.name);
		});

		// Initial Load request (wait for storage perm from native if needed, but safe to ask)
		// Native will trigger INIT or we can ask
		console.log("App Initialized");
		// We rely on Native 'checkPermission' result or INIT event.
		// But for now, let's ask for dir listing of root.
		EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: null } });
	}

	function handleEvent(event, native) {
		console.log("Received Event", event);

		switch(event.type) {
			case 'dir_list':
				state.path = event.data.path;
				explorer.items = event.data.items;
				// If we were in image view, switch back? No, dir_list usually means we are navigating.
				// If we back from image, we might re-request dir list.
				break;

			case 'back':
				navigateBack();
				break;

			case 'permission_response':
			case 'mode_change':
				 // If granted, reload
				 if (event.data.mode === 'normal') {
					 EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: null } });
				 }
				 break;
		}
	}

	function loadDir(path) {
		state.history.push({ view: 'explorer', path: state.path });
		EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: path } });
	}

	function openImage(path, name) {
		state.history.push({ view: 'explorer', path: state.path }); // Save where we came from

		state.view = 'image';
		state.currentImage = path;

		viewer.image = { path, name };

		explorer.classList.remove('active');
		viewer.classList.add('active');
	}

	function navigateBack() {
		if (state.view === 'image') {
			// Close image
			state.view = 'explorer';
			viewer.classList.remove('active');
			explorer.classList.add('active');
			viewer.image = { path: null }; // Clear memory

		} else {
			// We are in explorer.
			// Check history?
			// Or ask native to go up?
			// "user can navigate between directories and can use the hardware back button."

			// If we are at root, we can't go back in app, maybe exit?
			// Let's implement simple "Up directory" logic
			if (state.path && state.path !== '/storage/emulated/0') {
				 const parent = state.path.substring(0, state.path.lastIndexOf('/'));
				 // loadDir(parent) ? But we need to know if it's a valid parent.
				 // Actually, native file system list handles ".." usually?
				 // Or we can just pop from history if we track it.

				 // User requirement "use the hardware back button"
				 // If we have history, pop it.

				 if (state.history.length > 0) {
					 const prev = state.history.pop();
					 if (prev.view === 'explorer') {
						 EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: prev.path } });
					 }
				 } else {
					 // At root?
					 const parent = state.path.split('/').slice(0, -1).join('/');
					 if (parent && parent.length > 5) { // minimal check
						EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: parent } });
					 }
				 }
				 // Better: Ask native for parent?
				 // Or just implement simple UP logic here:
				 if (state.path.split('/').length > 4) { // /storage/emulated/0 is depth 4
					 const parent = state.path.substring(0, state.path.lastIndexOf('/'));
					 EventBus.dispatch({ type: 'list_dir', target: 'native', data: { path: parent } });
				 }
			}
		}
	}

	// init();
})();

*/